export type AppTheme = 'blue' | 'pink' | 'dark'

const STORAGE_KEY = 'app-theme'

export const VALID_APP_THEMES: AppTheme[] = ['blue', 'pink', 'dark']

export function getStoredTheme(): AppTheme {
  if (typeof localStorage === 'undefined') return 'blue'
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw && (VALID_APP_THEMES as string[]).includes(raw)) {
    return raw as AppTheme
  }
  return 'blue'
}

export function applyThemeToDocument(theme: AppTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

export function initThemeOnDocument() {
  applyThemeToDocument(getStoredTheme())
}

export function persistTheme(theme: AppTheme) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, theme)
}

export { STORAGE_KEY }
