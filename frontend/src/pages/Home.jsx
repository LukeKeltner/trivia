import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { get } from '../lib/api'

const TOPIC_STYLES = {
  'Pop Culture': { emoji: '🎬', bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-700',   hover: 'hover:bg-pink-100' },
  'Science':     { emoji: '🔬', bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   hover: 'hover:bg-blue-100' },
  'Video Games': { emoji: '🎮', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  hover: 'hover:bg-green-100' },
  'History':     { emoji: '📜', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  hover: 'hover:bg-amber-100' },
  'Sports':      { emoji: '🏆', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', hover: 'hover:bg-orange-100' },
}
const DEFAULT_STYLE = { emoji: '🎯', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', hover: 'hover:bg-gray-100' }

export default function Home() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [coins, setCoins] = useState(null)
  const [topics, setTopics] = useState([])

  useEffect(() => {
    get(`/game/profile/${user.id}`).then(data => setCoins(data.coins))
    get('/topics/').then(setTopics)
  }, [user.id])

  function selectTopic(topic) {
    navigate('/bet', { state: { topic, coins } })
  }

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center p-6 pt-10">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-[var(--color-primary)]">🧠 Trivia</h1>
            <p className="text-gray-400 font-semibold text-sm">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="text-sm font-bold text-gray-400 hover:text-red-400 transition"
          >
            Sign Out
          </button>
        </div>

        {/* Coin Balance */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-8 text-center border-2 border-[var(--color-primary-light)]">
          <p className="text-gray-400 font-bold text-sm uppercase tracking-wide mb-1">Your Balance</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl">🪙</span>
            <span className="text-5xl font-black text-[var(--color-gold)]">
              {coins ?? '...'}
            </span>
          </div>
          <p className="text-gray-400 font-semibold text-sm mt-1">coins</p>
        </div>

        {/* Topic Picker */}
        <div>
          <h2 className="text-lg font-black text-gray-700 mb-4">Pick a Topic</h2>
          <div className="grid grid-cols-2 gap-4">
            {topics.map(topic => {
              const style = TOPIC_STYLES[topic.name] ?? DEFAULT_STYLE
              return (
                <button
                  key={topic.id}
                  onClick={() => selectTopic(topic)}
                  className={`${style.bg} ${style.hover} border-2 ${style.border} rounded-2xl p-6 text-center transition`}
                >
                  <div className="text-4xl mb-2">{style.emoji}</div>
                  <p className={`font-black text-base ${style.text}`}>{topic.name}</p>
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
