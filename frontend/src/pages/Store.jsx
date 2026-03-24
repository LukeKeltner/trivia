import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { get, post } from '../lib/api'
import { THEMES, applyTheme } from '../lib/theme'

const AVATARS = [
  { emoji: '🧠', label: 'Brain', cost: 0 },
  { emoji: '🦊', label: 'Fox', cost: 50 },
  { emoji: '🐯', label: 'Tiger', cost: 50 },
  { emoji: '🦁', label: 'Lion', cost: 50 },
  { emoji: '🐺', label: 'Wolf', cost: 50 },
  { emoji: '🦅', label: 'Eagle', cost: 50 },
  { emoji: '🐉', label: 'Dragon', cost: 50 },
  { emoji: '🦄', label: 'Unicorn', cost: 50 },
  { emoji: '🐸', label: 'Frog', cost: 50 },
  { emoji: '🦋', label: 'Butterfly', cost: 50 },
  { emoji: '🐙', label: 'Octopus', cost: 50 },
  { emoji: '🦈', label: 'Shark', cost: 50 },
  { emoji: '🚀', label: 'Rocket', cost: 50 },
  { emoji: '👾', label: 'Alien', cost: 50 },
  { emoji: '🤖', label: 'Robot', cost: 50 },
  { emoji: '👑', label: 'Crown', cost: 50 },
  { emoji: '💎', label: 'Diamond', cost: 50 },
  { emoji: '🔥', label: 'Fire', cost: 50 },
  { emoji: '⚡', label: 'Lightning', cost: 50 },
  { emoji: '🌈', label: 'Rainbow', cost: 50 },
]

const TOPIC_TITLES = {
  'Pop Culture': 'Pop Culture Pro',
  'Science': 'Science Whiz',
  'Video Games': 'Game Guru',
  'History': 'History Buff',
  'Sports': 'Sports Fanatic',
}
const ALL_TOPICS_TITLE = 'Trivia Master'

export default function Store() {
  const { user } = useAuth()
  const [coins, setCoins] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [title, setTitle] = useState(null)
  const [theme, setTheme] = useState('purple')
  const [pendingTheme, setPendingTheme] = useState(null)
  const [themeLoading, setThemeLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [topics, setTopics] = useState([])
  const [progress, setProgress] = useState({})
  const [selectedTitle, setSelectedTitle] = useState(null)
  const [titleLoading, setTitleLoading] = useState(false)

  useEffect(() => {
    get(`/game/profile/${user.id}`).then(data => {
      setCoins(data.coins)
      setAvatar(data.avatar)
      setTitle(data.title ?? null)
      setTheme(data.theme ?? 'purple')
    })
    get('/topics/').then(setTopics)
    get(`/game/progress/${user.id}`).then(data => {
      // Aggregate subtopic progress by topic
      const map = {}
      data.forEach(p => {
        if (!map[p.topic_id]) map[p.topic_id] = { subtopicsWithQuestions: 0, subtopicsDone: 0 }
        if (p.total > 0) {
          map[p.topic_id].subtopicsWithQuestions += 1
          if (p.completed === p.total) map[p.topic_id].subtopicsDone += 1
        }
      })
      setProgress(map)
    })
  }, [user.id])

  function selectTheme(t) {
    if (t.id === theme) return
    setMessage(null)
    setPendingTheme(t)
    applyTheme(t.id) // live preview
  }

  function cancelTheme() {
    applyTheme(theme) // revert preview
    setPendingTheme(null)
  }

  async function confirmTheme() {
    if (!pendingTheme) return
    setThemeLoading(true)
    try {
      const data = await post('/game/theme', { user_id: user.id, theme: pendingTheme.id })
      setTheme(data.theme)
      setCoins(data.coins)
      setPendingTheme(null)
      setMessage({ type: 'success', text: `${pendingTheme.emoji} ${pendingTheme.name} theme equipped!` })
    } catch (err) {
      applyTheme(theme) // revert on failure
      setPendingTheme(null)
      const body = JSON.parse(err.message)
      setMessage({ type: 'error', text: body?.detail ?? 'Something went wrong.' })
    }
    setThemeLoading(false)
  }

  async function handleEquipTitle(t) {
    setTitleLoading(true)
    try {
      const data = await post('/game/title', { user_id: user.id, title: t === title ? null : t })
      setTitle(data.title)
      setSelectedTitle(null)
      setMessage({ type: 'success', text: data.title ? `Title "${data.title}" equipped!` : 'Title removed.' })
    } catch {
      setMessage({ type: 'error', text: 'Something went wrong.' })
    }
    setTitleLoading(false)
  }

  async function handleConfirm() {
    if (!selected || selected.emoji === avatar) return
    setLoading(true)
    setMessage(null)
    try {
      const data = await post('/game/avatar', { user_id: user.id, avatar: selected.emoji })
      setAvatar(data.avatar)
      setCoins(data.coins)
      setSelected(null)
      setMessage({ type: 'success', text: `${data.avatar} is now your avatar!` })
    } catch (err) {
      const body = JSON.parse(err.message)
      setMessage({ type: 'error', text: body?.detail ?? 'Something went wrong.' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center p-6 pt-10 pb-24">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-[var(--color-primary)]">🛒 Store</h1>
          <div className="flex items-center gap-1">
            <span>🪙</span>
            <span className="font-black text-[var(--color-gold)]">{coins?.toLocaleString() ?? '...'}</span>
          </div>
        </div>

        {/* Current avatar */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 text-center border-2 border-[var(--color-primary-light)]">
          <p className="text-gray-400 font-bold text-xs uppercase tracking-wide mb-2">Your Avatar</p>
          <div className="text-7xl mb-2">{avatar ?? '🧠'}</div>
          <p className="text-gray-500 font-bold text-sm">{AVATARS.find(a => a.emoji === avatar)?.label ?? 'Brain'}</p>
        </div>

        {/* Feedback message */}
        {message && (
          <div className={`px-4 py-3 rounded-2xl text-sm font-bold text-center mb-4 ${
            message.type === 'success'
              ? 'bg-green-50 border-2 border-green-200 text-green-700'
              : 'bg-red-50 border-2 border-red-200 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        {/* Confirm banner */}
        {selected && selected.emoji !== avatar && (
          <div className="bg-[var(--color-primary-light)] border-2 border-[var(--color-primary)] rounded-2xl p-4 mb-4 flex items-center justify-between">
            <div>
              <p className="font-black text-[var(--color-primary)]">
                {selected.emoji} {selected.label}
              </p>
              <p className="text-sm font-bold text-[var(--color-primary)] opacity-70">
                {selected.cost === 0 ? 'Free' : `Costs ${selected.cost} 🪙`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(null)}
                className="bg-white text-gray-500 font-black text-sm px-3 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || (selected.cost > 0 && coins < selected.cost)}
                className="bg-[var(--color-primary)] text-white font-black text-sm px-3 py-2 rounded-xl disabled:opacity-40"
              >
                {loading ? '...' : 'Equip'}
              </button>
            </div>
          </div>
        )}

        {/* Theme section */}
        <div className="mb-6">
          <h2 className="text-lg font-black text-gray-700 mb-1">Color Theme</h2>
          <p className="text-xs text-gray-400 font-bold mb-3">Changes your app colors. Purple is free, others cost 150 🪙</p>

          {/* Theme confirm banner */}
          {pendingTheme && (
            <div className="bg-[var(--color-primary-light)] border-2 border-[var(--color-primary)] rounded-2xl p-4 mb-4 flex items-center justify-between">
              <div>
                <p className="font-black text-[var(--color-primary)]">
                  {pendingTheme.emoji} {pendingTheme.name}
                </p>
                <p className="text-sm font-bold text-[var(--color-primary)] opacity-70">
                  {pendingTheme.cost === 0 ? 'Free' : `Costs ${pendingTheme.cost} 🪙`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={cancelTheme}
                  className="bg-white text-gray-500 font-black text-sm px-3 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmTheme}
                  disabled={themeLoading}
                  className="bg-[var(--color-primary)] text-white font-black text-sm px-3 py-2 rounded-xl disabled:opacity-40"
                >
                  {themeLoading ? '...' : 'Equip'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(t => {
              const isCurrent = t.id === theme
              const isPending = pendingTheme?.id === t.id
              const cantAfford = t.cost > 0 && coins !== null && coins < t.cost && !isCurrent
              return (
                <button
                  key={t.id}
                  onClick={() => !cantAfford && !isCurrent && selectTheme(t)}
                  disabled={isCurrent || cantAfford}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-2 border-2 transition ${
                    isCurrent
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                      : isPending
                      ? 'border-gray-400 bg-gray-100'
                      : cantAfford
                      ? 'border-gray-100 bg-gray-50 opacity-40'
                      : 'border-gray-100 bg-white hover:border-gray-300 cursor-pointer'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: t.primary }} />
                  <span className="text-xs font-black text-gray-600">{t.name}</span>
                  <span className="text-xs font-bold text-gray-400">
                    {isCurrent ? '✓ On' : isPending ? 'Selected' : t.cost === 0 ? 'Free' : `${t.cost}🪙`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Titles section */}
        {(() => {
          const completedTopics = topics.filter(t => {
            const p = progress[t.id]
            return p && p.subtopicsWithQuestions > 0 && p.subtopicsDone === p.subtopicsWithQuestions
          })
          const allDone = completedTopics.length === topics.length && topics.length > 0
          const availableTitles = [
            ...completedTopics.map(t => TOPIC_TITLES[t.name]).filter(Boolean),
            ...(allDone ? [ALL_TOPICS_TITLE] : []),
          ]

          if (availableTitles.length === 0) return null

          return (
            <div className="mb-6">
              <h2 className="text-lg font-black text-gray-700 mb-1">Titles</h2>
              <p className="text-xs text-gray-400 font-bold mb-3">Earned by completing topics. Free to equip.</p>
              {title && (
                <div className="bg-[var(--color-primary-light)] border-2 border-[var(--color-primary)] rounded-2xl px-4 py-3 mb-3 text-center">
                  <p className="text-xs text-[var(--color-primary)] font-bold uppercase tracking-wide mb-1">Current Title</p>
                  <p className="font-black text-[var(--color-primary)]">{title}</p>
                </div>
              )}
              <div className="space-y-2">
                {availableTitles.map(t => {
                  const isCurrent = t === title
                  const isPending = selectedTitle === t
                  return (
                    <div key={t} className={`flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition ${
                      isCurrent ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)]' : 'bg-white border-gray-100'
                    }`}>
                      <p className={`font-black ${isCurrent ? 'text-[var(--color-primary)]' : 'text-gray-700'}`}>{t}</p>
                      <button
                        onClick={() => { setMessage(null); handleEquipTitle(t) }}
                        disabled={titleLoading}
                        className={`text-sm font-black px-3 py-1.5 rounded-xl transition disabled:opacity-40 ${
                          isCurrent
                            ? 'bg-white text-[var(--color-primary)] border-2 border-[var(--color-primary)]'
                            : 'bg-[var(--color-primary)] text-white'
                        }`}
                      >
                        {titleLoading && isPending ? '...' : isCurrent ? 'Remove' : 'Equip'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Avatar grid */}
        <h2 className="text-lg font-black text-gray-700 mb-3">Choose Your Avatar</h2>
        <div className="grid grid-cols-4 gap-3">
          {AVATARS.map(a => {
            const isCurrent = a.emoji === avatar
            const isSelected = selected?.emoji === a.emoji
            const cantAfford = a.cost > 0 && coins !== null && coins < a.cost

            return (
              <button
                key={a.emoji}
                onClick={() => { setSelected(a); setMessage(null) }}
                className={`rounded-2xl p-3 flex flex-col items-center gap-1 border-2 transition ${
                  isCurrent
                    ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)]'
                    : isSelected
                    ? 'bg-gray-100 border-gray-400'
                    : cantAfford
                    ? 'bg-gray-50 border-gray-100 opacity-40'
                    : 'bg-white border-gray-100 hover:border-[var(--color-primary-light)]'
                }`}
              >
                <span className="text-3xl">{a.emoji}</span>
                <span className="text-xs font-black text-gray-500">
                  {isCurrent ? '✓ On' : a.cost === 0 ? 'Free' : `${a.cost}🪙`}
                </span>
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}
