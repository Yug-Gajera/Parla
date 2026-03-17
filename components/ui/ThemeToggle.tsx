'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('parlova-theme') as 
      'light' | 'dark' | null
    const preferred = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches ? 'dark' : 'light'
    const initial = saved || preferred
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
    // Also set class for Tailwind
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('parlova-theme', next)
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="no-transition"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        border: '1px solid var(--color-border-strong)',
        background: 'transparent',
        cursor: 'pointer',
        color: 'var(--color-text-secondary)',
        transition: 'all 0.15s ease',
      }}
    >
      {theme === 'light' 
        ? <Moon size={16} /> 
        : <Sun size={16} />
      }
    </button>
  )
}
