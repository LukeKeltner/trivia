import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { get } from '../lib/api'

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get('/game/leaderboard').then(data => {
      setEntries(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center p-6 pt-10 pb-24">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-[var(--color-primary)]">🏆 Leaderboard</h1>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 font-bold mt-12">Loading...</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry, i) => {
              const isMe = entry.id === user.id
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition ${
                    isMe
                      ? 'bg-[var(--color-primary-light)] border-[var(--color-primary)] '
                      : 'bg-white border-gray-100'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center text-xl shrink-0">
                    {MEDALS[i] ?? <span className="text-gray-400 font-black text-sm">#{i + 1}</span>}
                  </div>

                  {/* Avatar + Username */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl shrink-0">{entry.avatar}</span>
                    <div className="min-w-0">
                      <p className={`font-black truncate ${isMe ? 'text-[var(--color-primary)]' : 'text-gray-800'}`}>
                        {entry.username}
                        {isMe && <span className="ml-2 text-xs font-bold opacity-60">(you)</span>}
                      </p>
                      {entry.title && (
                        <p className={`text-xs font-bold truncate ${isMe ? 'text-[var(--color-primary)] opacity-70' : 'text-gray-400'}`}>
                          {entry.title}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Coins */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-lg">🪙</span>
                    <span className={`font-black text-lg ${isMe ? 'text-[var(--color-primary)]' : 'text-[var(--color-gold)]'}`}>
                      {entry.coins}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
