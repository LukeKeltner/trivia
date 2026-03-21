import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { get } from '../lib/api'

const QUICK_BETS = [
  { label: '25%', pct: 0.25 },
  { label: '50%', pct: 0.5 },
  { label: '75%', pct: 0.75 },
  { label: 'All In', pct: 1 },
]

export default function Bet() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { topic, coins } = state ?? {}
  const [bet, setBet] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!topic) { navigate('/'); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    const amount = parseInt(bet)
    if (!amount || amount <= 0) return setError('Enter a valid bet.')
    if (amount > coins) return setError("You don't have enough coins.")
    setLoading(true)
    try {
      const question = await get(`/questions/random?topic_id=${topic.id}`)
      navigate('/question', { state: { topic, coins, bet: amount, question } })
    } catch {
      setError('Failed to load question. Try again.')
      setLoading(false)
    }
  }

  function quickBet(pct) {
    setBet(String(Math.max(1, Math.floor(coins * pct))))
    setError(null)
  }

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        <button onClick={() => navigate('/')} className="text-gray-400 font-bold text-sm mb-6 hover:text-gray-600 transition">
          ← Back
        </button>

        <div className="bg-white rounded-3xl shadow-sm p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-gray-800">{topic.name}</h2>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-lg">🪙</span>
              <span className="text-xl font-black text-[var(--color-gold)]">{coins}</span>
              <span className="text-gray-400 font-semibold text-sm">coins available</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-black text-gray-600 mb-2 uppercase tracking-wide">
                Your Bet
              </label>
              <input
                type="number"
                min="1"
                max={coins}
                value={bet}
                onChange={e => { setBet(e.target.value); setError(null) }}
                placeholder="0"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-2xl font-black text-center focus:outline-none focus:border-[var(--color-primary)] transition"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {QUICK_BETS.map(({ label, pct }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => quickBet(pct)}
                  className="bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-black py-2 rounded-xl hover:bg-[var(--color-primary)] hover:text-white transition"
                >
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm font-bold px-4 py-2 rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-4 rounded-xl font-black text-lg transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Place Bet 🎲'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
