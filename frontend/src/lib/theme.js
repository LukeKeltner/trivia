export const THEMES = [
  { id: 'purple',  name: 'Purple',     emoji: '💜', cost: 0,   primary: '#7C3AED', hover: '#6D28D9', light: '#EDE9FE', bg: '#F5F3FF' },
  { id: 'blue',    name: 'Ocean Blue', emoji: '💙', cost: 150, primary: '#2563EB', hover: '#1D4ED8', light: '#DBEAFE', bg: '#EFF6FF' },
  { id: 'green',   name: 'Forest',     emoji: '💚', cost: 150, primary: '#16A34A', hover: '#15803D', light: '#DCFCE7', bg: '#F0FDF4' },
  { id: 'rose',    name: 'Rose',       emoji: '🩷', cost: 150, primary: '#E11D48', hover: '#BE123C', light: '#FFE4E6', bg: '#FFF1F2' },
  { id: 'orange',  name: 'Sunset',     emoji: '🧡', cost: 150, primary: '#EA580C', hover: '#C2410C', light: '#FFEDD5', bg: '#FFF7ED' },
  { id: 'teal',    name: 'Teal',       emoji: '🩵', cost: 150, primary: '#0D9488', hover: '#0F766E', light: '#CCFBF1', bg: '#F0FDFA' },
]

export function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) ?? THEMES[0]
  const root = document.documentElement
  root.style.setProperty('--color-primary', theme.primary)
  root.style.setProperty('--color-primary-hover', theme.hover)
  root.style.setProperty('--color-primary-light', theme.light)
  root.style.setProperty('--color-game-bg', theme.bg)
  localStorage.setItem('theme', themeId)
}
