import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

export default function Subtopics() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { topic, coins } = state ?? {}
  const [subtopics, setSubtopics] = useState([])
  const [progress, setProgress] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!topic) { navigate('/'); return }
    Promise.all([
      get(`/topics/${topic.id}/subtopics`),
      get(`/game/progress/${user.id}`),
    ]).then(([subs, prog]) => {
      setSubtopics(subs)
      const map = {}
      prog.forEach(p => { map[p.subtopic_id] = p })
      setProgress(map)
      setLoading(false)
    })
  }, [])

  if (!topic) return null

  const style = TOPIC_STYLES[topic.name] ?? DEFAULT_STYLE

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center p-6 pt-10 pb-24">
      <div className="w-full max-w-md">

        <button onClick={() => navigate('/')} className="text-gray-400 font-bold text-sm mb-6 hover:text-gray-600 transition">
          ← Back
        </button>

        {/* Topic header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{style.emoji}</span>
          <div>
            <h1 className="text-2xl font-black text-gray-800">{topic.name}</h1>
            <p className="text-gray-400 font-bold text-sm">Pick a subtopic to play</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 font-bold mt-12">Loading...</p>
        ) : (
          <div className="space-y-3">
            {subtopics.map(sub => {
              const p = progress[sub.id]
              const total = p?.total ?? 0
              const completed = p?.completed ?? 0
              const done = total > 0 && completed === total
              const pct = total > 0 ? Math.round((completed / total) * 100) : null
              const hasQuestions = total > 0

              return (
                <button
                  key={sub.id}
                  onClick={() => !done && navigate('/bet', { state: { subtopic: sub, topic, coins } })}
                  disabled={done}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition relative ${
                    done
                      ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-75'
                      : `${style.bg} ${style.hover} ${style.border} cursor-pointer`
                  }`}
                >
                  {done && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">🎉</span>
                  )}
                  <div className="flex items-center justify-between pr-6">
                    <p className={`font-black text-base ${done ? 'text-gray-500' : style.text}`}>
                      {done ? '✅ ' : ''}{sub.name}
                    </p>
                    {pct !== null && (
                      <span className={`text-xs font-bold ${done ? 'text-gray-400' : `opacity-60 ${style.text}`}`}>
                        {done ? 'Mastered!' : `${completed}/${total}`}
                      </span>
                    )}
                  </div>
                  {hasQuestions && !done && (
                    <div className="mt-2 h-1.5 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: 'currentColor' }}
                      />
                    </div>
                  )}
                  {!hasQuestions && (
                    <p className="text-xs font-bold text-gray-400 mt-1">No questions yet</p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
