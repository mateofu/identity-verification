import type { Theme } from '../../types/theme'

interface ThemeToggleProps {
  theme: Theme
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDarkTheme = theme === 'dark'
  const targetThemeLabel = isDarkTheme ? 'claro' : 'oscuro'

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Cambiar al tema ${targetThemeLabel}`}
      title={`Cambiar al tema ${targetThemeLabel}`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isDarkTheme ? '☀' : '☾'}
      </span>
    </button>
  )
}
