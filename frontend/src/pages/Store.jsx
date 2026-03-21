import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { get, post } from '../lib/api'

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

export default function Store() {
  const { user } = useAuth()
  const [coins, setCoins] = useState(null)
  const [avatar, setAvatar] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    get(`/game/profile/${user.id}`).then(data => {
      setCoins(data.coins)
      setAvatar(data.avatar)
    })
  }, [user.id])

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
            <span className="font-black text-[var(--color-gold)]">{coins ?? '...'}</span>
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
