import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/lib/theme'

export default function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const baseBtn = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200'
  const active = 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
  const inactive = 'text-surface-500 hover:bg-surface-100 hover:text-surface-800 dark:text-slate-300 dark:hover:bg-slate-700/60 dark:hover:text-white'

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl bg-white/90 backdrop-blur-md border border-surface-200 shadow-sm dark:bg-slate-800/90 dark:border-slate-700"
      role="group"
      aria-label="Mode d'affichage"
    >
      <button
        onClick={() => setTheme('light')}
        title="Mode clair"
        aria-label="Mode clair"
        aria-pressed={theme === 'light'}
        className={`${baseBtn} ${theme === 'light' ? active : inactive}`}
      >
        <Sun size={13} />
        Clair
      </button>
      <button
        onClick={() => setTheme('dark')}
        title="Mode sombre"
        aria-label="Mode sombre"
        aria-pressed={theme === 'dark'}
        className={`${baseBtn} ${theme === 'dark' ? active : inactive}`}
      >
        <Moon size={13} />
        Sombre
      </button>
    </div>
  )
}