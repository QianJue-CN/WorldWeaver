export const supportedLocales = ["en", "zh-CN"] as const

export type AppLocale = (typeof supportedLocales)[number]

export const defaultLocale: AppLocale = "en"

export const localeStorageKey = "worldweaver.locale"

export const localeCatalog = [
  {
    code: "en",
    label: "English",
    nativeLabel: "English",
    shortLabel: "EN",
  },
  {
    code: "zh-CN",
    label: "Simplified Chinese",
    nativeLabel: "简体中文",
    shortLabel: "中",
  },
] as const satisfies readonly {
  code: AppLocale
  label: string
  nativeLabel: string
  shortLabel: string
}[]

export type LocalizedValue<T> = Record<AppLocale, T>

export function isAppLocale(value: string): value is AppLocale {
  return supportedLocales.includes(value as AppLocale)
}

export function resolveLocale(value?: string | null): AppLocale {
  if (!value) {
    return defaultLocale
  }

  const normalized = value.trim().toLowerCase()

  if (normalized.startsWith("zh")) {
    return "zh-CN"
  }

  if (normalized.startsWith("en")) {
    return "en"
  }

  return defaultLocale
}

export function pickLocalized<T>(
  values: LocalizedValue<T>,
  locale: AppLocale,
): T {
  return values[resolveLocale(locale)]
}
