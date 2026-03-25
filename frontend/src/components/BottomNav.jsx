import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { label: 'Play', emoji: '🧠', path: '/' },
  { label: 'Compete', emoji: '⚔️', path: '/competition' },
  { label: 'Leaderboard', emoji: '🏆', path: '/leaderboard' },
  { label: 'Store', emoji: '🛒', path: '/store' },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 flex justify-around py-3 px-6">
      {TABS.map(tab => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-1 transition ${
              active ? 'text-[var(--color-primary)]' : 'text-gray-400'
            }`}
          >
            <span className="text-2xl">{tab.emoji}</span>
            <span className={`text-xs font-black ${active ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
