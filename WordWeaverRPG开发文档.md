# WorldWeaver RPG 开发文档

## 1. 文档目标

本文档用于统一 WorldWeaver RPG 的产品范围、系统架构、核心流程、数据模型与接口约定，作为前后端开发、数据库设计、模型接入与后续迭代的基础依据。

本版本重点解决以下问题：

1. 长上下文对话中的记忆丢失与信息漂移
2. 世界观全局设定与单次跑团进度之间的隔离
3. 世界观生成阶段的低成本迭代与正式固化
4. 多模型、多搜索源、多向量服务的可插拔接入

说明：

- 文档统一使用 `WorldWeaver RPG` 作为项目名称
- PostgreSQL 为事实源（Source of Truth）
- Qdrant 仅承担语义检索，不作为主存储

## 2. 项目定义

### 2.1 产品定位

WorldWeaver RPG 是一个基于大语言模型（LLM）的角色扮演游戏引擎。系统允许创作者先定义世界观，再让玩家在该世界观下发起独立会话，通过结构化记忆、摘要记忆与向量检索共同支撑长程叙事。

### 2.2 目标用户

- 创作者：创建、修改并发布世界观
- 玩家：在指定世界观下开启个人或小队跑团
- 管理员：管理模型配置、系统健康状态与基础设施

### 2.3 MVP 范围

首期建议只覆盖以下闭环能力：

1. 世界观草稿生成
2. 草稿多轮修改
3. 世界观正式固化
4. 单会话聊天与记忆注入
5. 结构化记忆提取与编辑
6. PostgreSQL + Qdrant 的异步同步

以下内容可放到后续版本：

- 多人联机跑团
- 图像生成或地图生成
- 复杂权限系统
- 自动剧情导演（GM Agent）集群
- 跨世界观推荐与公共素材市场

## 3. 设计原则

### 3.1 分层记忆优先

Prompt 中不直接堆叠全部历史，而是按工作记忆、情景记忆、长期记忆分层注入，优先保证当前剧情连续性。

### 3.2 世界与会话强隔离

所有数据必须同时带上 `world_id`，会话级数据额外带上 `session_id`，避免不同世界观或不同跑团之间串档。

### 3.3 草稿与正式数据分离

世界观创建过程中的草稿不进入正式检索库；只有用户确认后，才会抽取结构化记忆并写入正式存储。

### 3.4 结构化优先，向量辅助

结构化 JSON 负责事实存储、编辑和审计；向量索引仅用于语义召回与相关性排序。

### 3.5 主存储可靠性优先于即时检索

PostgreSQL 和 Qdrant 不能依赖“伪分布式事务”做强一致双写。正确策略应为：

1. 先把事实数据写入 PostgreSQL
2. 再通过异步任务生成 Embedding 并同步到 Qdrant
3. 通过重试、版本号和幂等更新保证最终一致

## 4. 核心术语

| 术语 | 含义 |
| --- | --- |
| World | 一个完整世界观，包含地理、历史、阵营、规则等全局设定 |
| Session | 基于某个 World 开启的一次独立跑团会话 |
| Global Memory | 世界级共享记忆，对该世界下所有 Session 可见 |
| Session Memory | 会话专属记忆，只对当前 Session 生效 |
| Working Memory | 最近若干轮对话、角色卡、系统规则等高优先级上下文 |
| Episodic Memory | 历史剧情的章节摘要或阶段总结 |
| Long-term Memory | 存在 PostgreSQL 中、通过 Qdrant 召回的结构化长期记忆 |
| Draft | 世界观草稿状态，仅用于生成和修改，不进入正式检索 |
| Commit | 将草稿固化为正式世界观并写入记忆系统 |
| Extraction Worker | 异步提取实体、事件、关系并生成结构化记忆的后台任务 |

## 5. 总体架构

系统建议采用前后端分离 + 后台异步任务架构。

### 5.1 前端层

| 模块 | 职责 |
| --- | --- |
| Chat UI | 展示对话、玩家输入、AI 回复、记忆提示 |
| World Builder UI | 创建世界观草稿、迭代修改、提交固化 |
| Memory Manager | 以表单或 JSON 形式查看和编辑结构化记忆 |
| Settings UI | 配置模型、向量服务、搜索服务及其鉴权信息 |

### 5.2 后端服务层

| 模块 | 职责 |
| --- | --- |
| API Gateway / BFF | 统一接收前端请求，完成鉴权、参数校验和请求编排 |
| Model Adapter | 将统一消息格式转换为 OpenAI、Anthropic、Gemini、本地模型等供应商格式 |
| Search Agent | 在世界观创建期调用 Tavily、SearxNG 等服务做资料检索 |
| Memory Engine | 负责记忆召回、Prompt 拼装、注入顺序控制 |
| Extraction Worker | 从对话或世界草稿中提取实体、关系、事件和状态变化 |
| Embedding Sync Worker | 负责文本向量化、Qdrant Upsert、失败重试 |
| Summary Worker | 生成阶段摘要和情景记忆，降低长会话上下文体积 |

### 5.3 存储层

| 组件 | 角色 |
| --- | --- |
| PostgreSQL | 主数据存储，保存世界观、会话、消息、结构化记忆、同步任务 |
| Qdrant | 向量检索，按 `world_id` / `session_id` / `scope` 做过滤 |
| Redis | 草稿缓存、任务队列、短期状态缓存 |
| Object Storage（可选） | 保存大段原始草稿、导出文件、日志快照 |

## 6. 核心业务流程

### 6.1 世界观创建流程

#### 阶段 A：初版草稿生成

1. 用户输入简短设定或主题关键词
2. 用户可选择是否启用联网搜索
3. Search Agent 拉取外部参考资料并做清洗摘要
4. LLM 生成世界观草稿与结构大纲
5. 草稿保存为 `draft` 状态，不写入正式记忆库

输入：

- `base_prompt`
- `enable_search`
- `provider_config_id`

输出：

- `draft_id`
- `draft_text`
- `outline`
- `reference_notes`

#### 阶段 B：草稿迭代修改

1. 用户阅读草稿并提出修改意见
2. 系统保留当前草稿版本
3. LLM 基于“旧草稿 + 新反馈”生成新版本
4. 可重复多轮，直到用户确认

建议保留版本链：

- `version_no`
- `change_note`
- `updated_by`
- `updated_at`

#### 阶段 C：正式固化

1. 用户点击“确认创建世界”
2. 系统创建 `world` 记录，状态为 `processing`
3. Extraction Worker 将最终草稿拆分为结构化记忆节点
4. 结构化节点写入 PostgreSQL
5. 生成 Embedding 同步任务
6. Sync Worker 写入 Qdrant
7. 所有必需节点同步完成后，`world.status` 切换为 `active`

状态建议：

- `draft`：仅草稿阶段存在
- `processing`：已提交固化，正在抽取或同步
- `active`：正式可用
- `archived`：下线但保留数据

### 6.2 游戏会话流程

1. 玩家进入某个 `world_id` 下的新会话
2. 前端提交用户输入到 `/chat/send`
3. 后端加载世界规则、角色信息、最近消息、摘要记忆
4. Memory Engine 对输入做检索，召回全局与当前会话相关记忆
5. Model Adapter 调用目标模型生成回复
6. 回复写入消息表
7. 异步触发 Extraction Worker 更新会话记忆
8. 新记忆进入 PostgreSQL，并排入向量同步队列

### 6.3 记忆编辑流程

1. 用户在 Memory Manager 中定位某条记忆
2. 更新结构化字段并生成新版本
3. PostgreSQL 中完成事实更新
4. 写入 `embedding_outbox`
5. Sync Worker 重新生成向量并覆盖 Qdrant 中旧版本

说明：

- `global` 记忆应仅允许世界创建者或管理员编辑
- `session` 记忆仅允许当前会话拥有者编辑
- 编辑操作应记录审计字段，至少包含 `updated_by` 与 `updated_at`

## 7. 记忆系统设计

### 7.1 分级记忆策略

建议采用三层记忆结构：

#### 1. Working Memory

包含以下内容：

- 系统规则
- 世界核心限制
- 玩家角色卡
- 最近 10 到 20 轮对话

特点：

- 优先级最高
- 直接参与本轮回复生成
- 应固定放在 Prompt 头部和尾部的关键位置

#### 2. Episodic Memory

包含以下内容：

- 章节摘要
- 阶段目标
- 已完成任务
- 最近重大关系变化

特点：

- 由 Summary Worker 定期生成
- 用于补足中距离剧情连续性
- 比原始历史消息更节省 Token

#### 3. Long-term Memory

包含以下内容：

- 世界设定
- 阵营、地点、规则、任务、物品、人物
- 会话中产生的长期影响

特点：

- PostgreSQL 保存事实
- Qdrant 提供语义召回
- 召回时必须做作用域过滤

### 7.2 Prompt 注入顺序建议

建议的 Prompt 组装顺序如下：

1. 系统级规则
2. 世界核心设定摘要
3. 当前角色卡或玩家状态
4. Episodic Memory
5. Long-term Memory 检索结果
6. 最近多轮对话
7. 当前用户输入

说明：

- 关键规则不要只放中间位置
- 召回记忆应做去重与压缩，避免语义重复
- 同一实体多版本同时命中时，只注入最新有效版本

### 7.3 结构化提取策略

每次 AI 回复后，系统异步触发信息提取任务，输出严格 JSON。

建议不要允许顶层字段无限扩散，而是采用固定骨架 + 动态属性的方式：

```json
{
  "memory_id": "mem_faction_001",
  "scope": "global",
  "world_id": "world_vampire_london",
  "session_id": null,
  "category": "faction",
  "title": "血色内阁",
  "summary": "掌控伦敦金融和能源命脉的吸血鬼统治集团。",
  "attributes": {
    "style": "维多利亚贵族 + 赛博改造",
    "power_source": "能源垄断",
    "public_image": "旧秩序守护者"
  },
  "relations": [
    {
      "target_id": "mem_location_014",
      "type": "controls"
    }
  ],
  "tags": ["faction", "politics", "vampire"],
  "status": "active",
  "version": 1
}
```

这样做的好处：

1. 查询和校验更稳定
2. 前端表单更容易生成
3. 动态扩展能力依然保留在 `attributes` 中

### 7.4 同步一致性策略

原始设计中的“PostgreSQL 事务 + Qdrant 同时提交”在工程上并不可靠，因为二者不共享同一事务边界。

推荐采用 Outbox Pattern：

1. 业务事务内写入 PostgreSQL 主数据
2. 同时写入一条 `embedding_outbox` 记录
3. 后台 Worker 扫描待处理任务
4. 生成 Embedding 并 Upsert 到 Qdrant
5. 成功后把任务标记为 `done`
6. 失败则重试，超限后进入死信状态

关键要求：

- Qdrant Upsert 必须幂等
- 记忆实体必须有 `version`
- 查询时优先使用最新版本
- Worker 支持补偿和重放

## 8. 数据模型设计

### 8.1 推荐关系表

相比“把整个世界或会话塞进一个大 JSONB 字段”，更推荐实体级存储。这样更利于并发更新、审计、版本控制和向量同步。

#### `worlds`

| 字段 | 说明 |
| --- | --- |
| `world_id` | 主键 |
| `creator_id` | 创建者 |
| `world_name` | 世界名称 |
| `theme` | 核心主题 |
| `status` | `draft` / `processing` / `active` / `archived` |
| `current_draft_id` | 当前关联草稿 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

#### `world_drafts`

| 字段 | 说明 |
| --- | --- |
| `draft_id` | 主键 |
| `world_id` | 可空；未正式创建世界时可先为空 |
| `version_no` | 草稿版本号 |
| `draft_text` | 世界观草稿全文 |
| `outline_json` | 草稿大纲 |
| `reference_notes` | 搜索参考摘要 |
| `status` | `editing` / `locked` / `committed` |
| `created_at` | 创建时间 |

#### `sessions`

| 字段 | 说明 |
| --- | --- |
| `session_id` | 主键 |
| `world_id` | 所属世界 |
| `user_id` | 玩家或房主 |
| `title` | 会话标题 |
| `status` | `active` / `paused` / `ended` |
| `summary_text` | 当前阶段摘要 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

#### `chat_messages`

| 字段 | 说明 |
| --- | --- |
| `message_id` | 主键 |
| `session_id` | 所属会话 |
| `role` | `system` / `user` / `assistant` / `tool` |
| `content` | 消息内容 |
| `token_count` | 可选，便于成本统计 |
| `created_at` | 创建时间 |

#### `memory_nodes`

| 字段 | 说明 |
| --- | --- |
| `memory_id` | 主键 |
| `world_id` | 必填 |
| `session_id` | 全局记忆为空，会话记忆必填 |
| `scope` | `global` / `session` |
| `category` | 如 `character` / `location` / `faction` / `rule` / `quest` |
| `title` | 实体标题 |
| `summary` | 简短概述 |
| `content_json` | 完整结构化内容 |
| `status` | `active` / `superseded` / `deleted` |
| `version` | 版本号 |
| `source_type` | `draft_commit` / `chat_extract` / `manual_edit` |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

#### `embedding_outbox`

| 字段 | 说明 |
| --- | --- |
| `job_id` | 主键 |
| `memory_id` | 对应记忆节点 |
| `version` | 本次同步版本 |
| `status` | `pending` / `processing` / `done` / `failed` / `dead_letter` |
| `retry_count` | 重试次数 |
| `last_error` | 最近错误信息 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

### 8.2 逻辑隔离规则

必须遵守以下约束：

1. 每条记忆都必须绑定 `world_id`
2. `scope = global` 时，`session_id` 必须为空
3. `scope = session` 时，`session_id` 必须非空
4. 所有查询都必须先按 `world_id` 过滤
5. 会话查询时，允许同时取 `global + current session`

### 8.3 Qdrant Payload 建议

```json
{
  "memory_id": "mem_faction_001",
  "world_id": "world_vampire_london",
  "session_id": null,
  "scope": "global",
  "category": "faction",
  "status": "active",
  "version": 3
}
```

查询原则：

1. 必须匹配当前 `world_id`
2. 必须只取 `status = active`
3. 可以同时召回 `scope = global` 和 `session_id = current_session_id`
4. 如果存在旧版本，应用层只保留最新版本

## 9. API 设计建议

接口风格建议统一为 JSON over HTTP，响应结构统一为：

```json
{
  "code": 0,
  "message": "ok",
  "data": {},
  "request_id": "req_xxx"
}
```

### 9.1 世界观草稿接口

#### `POST /api/worlds/drafts/generate`

用途：生成初版草稿

请求示例：

```json
{
  "base_prompt": "我想要一个维多利亚蒸汽朋克和吸血鬼混合的伦敦世界",
  "enable_search": true,
  "provider_config_id": "cfg_openai_default"
}
```

返回重点：

- `draft_id`
- `draft_text`
- `outline`
- `reference_notes`

#### `POST /api/worlds/drafts/refine`

用途：根据反馈修改草稿

请求示例：

```json
{
  "draft_id": "draft_001",
  "user_feedback": "把血色内阁改得更赛博朋克一些，并加入机械改造设定",
  "provider_config_id": "cfg_openai_default"
}
```

#### `POST /api/worlds/commit`

用途：将草稿正式固化为世界观

请求示例：

```json
{
  "draft_id": "draft_001",
  "world_name": "蒸汽血都",
  "theme": "赛博朋克 + 维多利亚 + 吸血鬼"
}
```

返回重点：

- `world_id`
- `status`
- `queued_jobs`

### 9.2 会话接口

#### `POST /api/sessions`

用途：在某个世界下创建新会话

#### `POST /api/chat/send`

用途：发送一轮消息并获得 AI 回复

请求示例：

```json
{
  "session_id": "session_12345",
  "user_message": "我想潜入血色内阁的地下档案库",
  "provider_config_id": "cfg_openai_default"
}
```

后端流程：

1. 加载会话状态
2. 召回全局与会话记忆
3. 组装 Prompt
4. 调用模型
5. 保存消息
6. 异步提取记忆更新

### 9.3 记忆接口

#### `GET /api/worlds/{world_id}/memories`

用途：获取世界级记忆列表

#### `GET /api/sessions/{session_id}/memories`

用途：获取当前会话记忆列表

#### `PATCH /api/memories/{memory_id}`

用途：修改某条结构化记忆

#### `POST /api/memories/reindex`

用途：手动触发指定记忆或指定范围的向量重建

## 10. 配置与安全要求

### 10.1 Provider 配置

系统应支持以下可插拔配置：

- LLM Provider
- Embedding Provider
- Search Provider
- Qdrant / PostgreSQL 连接配置

### 10.2 API Key 管理

不建议把原始 API Key 明文长期保存在前端或普通日志中。

建议方案：

1. 前端只提交一次密钥
2. 后端加密后存储
3. 前端再次读取时只返回脱敏结果
4. 调用链路中打印 `provider_config_id`，不要打印明文密钥

### 10.3 权限边界

- 世界创建者可编辑世界级记忆
- 玩家只能编辑自己的会话级记忆
- 管理员可做手动重建、回放和异常修复

## 11. 非功能性要求

### 11.1 性能目标

- 非联网对话场景，首个回复尽量控制在 8 秒内
- 向量检索延迟尽量控制在亚秒级
- 世界观固化允许异步完成，但要向用户展示进度

### 11.2 可靠性目标

- PostgreSQL 写入成功后，数据不得丢失
- Qdrant 同步失败不应阻塞主流程，但必须可重试
- Worker 崩溃后任务应可恢复

### 11.3 可观测性

建议统一记录以下字段：

- `request_id`
- `world_id`
- `session_id`
- `provider`
- `model_name`
- `latency_ms`
- `token_usage`
- `worker_job_id`

## 12. 开发阶段建议

### 阶段 1：核心闭环

1. 世界草稿生成
2. 草稿迭代
3. 世界固化
4. 单会话聊天
5. 基础记忆提取

### 阶段 2：记忆增强

1. Summary Worker
2. Memory Manager 可视化编辑
3. 手动重建索引
4. 版本与审计能力

### 阶段 3：工程强化

1. 多模型路由策略
2. Provider 配置管理
3. 搜索结果清洗与引用管理
4. 监控、告警和死信修复工具

## 13. 当前版本结论

WorldWeaver RPG 的核心价值不只是“让模型陪玩家聊天”，而是建立一套可持续运行的世界观记忆系统。系统设计上必须明确：

1. PostgreSQL 是事实源，Qdrant 是检索加速层
2. 世界草稿与正式世界必须分状态管理
3. 全局记忆与会话记忆必须硬隔离
4. 结构化提取应采用固定骨架 + 动态属性，而不是无限散开的自由 JSON
5. 双写一致性应通过异步同步与补偿机制解决，而不是依赖不可控的跨系统事务

按以上方案实施后，文档能够更直接支撑数据库建模、接口开发、前端联调与后续扩展。
