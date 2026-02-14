import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'
const THEME_SYSTEM = 'system'
const THEME_LIGHT = 'light'
const THEME_DARK = 'dark'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

const getStoredTheme = () => {
  if (typeof window === 'undefined') return THEME_SYSTEM
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === THEME_LIGHT || saved === THEME_DARK || saved === THEME_SYSTEM) return saved
  return THEME_SYSTEM
}

const getSystemPrefersDark = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(getStoredTheme)
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark)

  const isDark = themeMode === THEME_SYSTEM
    ? systemPrefersDark
    : themeMode === THEME_DARK

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => setSystemPrefersDark(media.matches)
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const setTheme = (mode) => {
    setThemeMode(mode)
  }

  const cycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === THEME_SYSTEM) return THEME_LIGHT
      if (prev === THEME_LIGHT) return THEME_DARK
      return THEME_SYSTEM
    })
  }

  const themeLabel = themeMode === THEME_SYSTEM
    ? 'Sistema'
    : themeMode === THEME_LIGHT
      ? 'Claro'
      : 'Escuro'

  const nextThemeLabel = themeMode === THEME_SYSTEM
    ? 'Claro'
    : themeMode === THEME_LIGHT
      ? 'Escuro'
      : 'Sistema'

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        themeMode,
        themeLabel,
        nextThemeLabel,
        setTheme,
        cycleTheme,
        THEME_SYSTEM,
        THEME_LIGHT,
        THEME_DARK,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
