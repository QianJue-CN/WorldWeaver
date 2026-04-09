import { z } from "zod"
import { providerConfigDescriptorSchema } from "./providers.js"

export const appLocaleSchema = z.enum(["en", "zh-CN"])
export const serviceIdSchema = z.enum(["web", "api", "worker"])
export const roadmapStageSchema = z.enum(["foundation", "mvp", "next"])

export const serviceDescriptorSchema = z.object({
  id: serviceIdSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  responsibilities: z.array(z.string().min(1)).min(1),
})

export const capabilitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  stage: roadmapStageSchema,
})

export const infrastructureTargetSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  connection_env: z.array(z.string().min(1)).min(1),
})

export const apiRouteDescriptorSchema = z.object({
  method: z.enum(["GET", "POST", "DELETE"]),
  path: z.string().min(1),
  purpose: z.string().min(1),
})

export const workerJobDescriptorSchema = z.object({
  id: z.string().min(1),
  trigger: z.string().min(1),
  summary: z.string().min(1),
})

export const bootstrapSummarySchema = z.object({
  project_name: z.string().min(1),
  product_intent: z.string().min(1),
  services: z.array(serviceDescriptorSchema).min(1),
  capabilities: z.array(capabilitySchema).min(1),
  infrastructure: z.array(infrastructureTargetSchema).min(1),
})

export const bootstrapCatalogQuerySchema = z.object({
  locale: appLocaleSchema.optional(),
})

export const bootstrapCatalogResponseSchema = bootstrapSummarySchema.extend({
  api_routes: z.array(apiRouteDescriptorSchema).min(1),
  provider_configs: z.array(providerConfigDescriptorSchema).min(1),
  worker_jobs: z.array(workerJobDescriptorSchema).min(1),
})

export type BootstrapSummary = z.infer<typeof bootstrapSummarySchema>
export type AppLocale = z.infer<typeof appLocaleSchema>
export type BootstrapCatalogQuery = z.infer<typeof bootstrapCatalogQuerySchema>
export type BootstrapCatalogResponse = z.infer<
  typeof bootstrapCatalogResponseSchema
>
