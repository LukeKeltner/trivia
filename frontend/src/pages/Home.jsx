import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { get, post } from '../lib/api'

const TOPIC_STYLES = {
  'Pop Culture': { emoji: '🎬', bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-700',   bar: '#ec4899' },
  'Science':     { emoji: '🔬', bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   bar: '#3b82f6' },
  'Video Games': { emoji: '🎮', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  bar: '#22c55e' },
  'History':     { emoji: '📜', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  bar: '#f59e0b' },
  'Sports':      { emoji: '🏆', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: '#f97316' },
}
const DEFAULT_STYLE = { emoji: '🎯', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', bar: '#6b7280' }

export default function Home() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [coins, setCoins] = useState(null)
  const [avatar, setAvatar] = useState('🧠')
  const [toppedUp, setToppedUp] = useState(false)
  const [topics, setTopics] = useState([])
  const [allSubtopics, setAllSubtopics] = useState({})
  const [topicProgress, setTopicProgress] = useState({})
  const [subtopicProgress, setSubtopicProgress] = useState({})
  const [selectedTopic, setSelectedTopic] = useState(null)

  useEffect(() => {
    get(`/game/profile/${user.id}`).then(data => {
      setCoins(data.coins)
      setToppedUp(data.topped_up)
      setAvatar(data.avatar ?? '🧠')
    })
    get('/topics/').then(setTopics)
    get('/topics/all-subtopics').then(data => {
      const map = {}
      data.forEach(s => {
        if (!map[s.topic_id]) map[s.topic_id] = []
        map[s.topic_id].push(s)
      })
      setAllSubtopics(map)
    }).catch(() => {}) // non-fatal — will fetch on click if this fails
    get(`/game/progress/${user.id}`).then(data => {
      const tMap = {}
      const sMap = {}
      data.forEach(p => {
        sMap[p.subtopic_id] = { total: p.total, completed: p.completed }
        if (!tMap[p.topic_id]) tMap[p.topic_id] = { total: 0, completed: 0, subtopicsWithQuestions: 0, subtopicsDone: 0 }
        if (p.total > 0) {
          tMap[p.topic_id].total += p.total
          tMap[p.topic_id].completed += p.completed
          tMap[p.topic_id].subtopicsWithQuestions += 1
          if (p.completed === p.total) tMap[p.topic_id].subtopicsDone += 1
        }
      })
      setTopicProgress(tMap)
      setSubtopicProgress(sMap)
    })
  }, [user.id])

  async function handleReset() {
    if (!confirm('Reset your data? This will set your coins back to 100 and clear all progress.')) return
    await post('/game/reset', { user_id: user.id, username: user.email })
    setCoins(100)
    setTopicProgress({})
    setSubtopicProgress({})
    setToppedUp(false)
  }

  function handleTopicSelect(topic) {
    setSelectedTopic(topic)
    if (!allSubtopics[topic.id]) {
      get(`/topics/${topic.id}/subtopics`).then(data => {
        setAllSubtopics(prev => ({ ...prev, [topic.id]: data }))
      })
    }
  }

  const style = selectedTopic ? (TOPIC_STYLES[selectedTopic.name] ?? DEFAULT_STYLE) : null
  const subtopics = selectedTopic ? (allSubtopics[selectedTopic.id] ?? []) : []

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-[var(--color-primary)]">{avatar} Trivia</h1>
            <p className="text-gray-400 font-semibold text-sm">{user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-[var(--color-gold-light)] px-3 py-1.5 rounded-xl">
              <span>🪙</span>
              <span className="font-black text-lg text-[var(--color-gold)]">{coins?.toLocaleString() ?? '...'}</span>
            </div>
            <button onClick={handleReset} className="text-sm font-bold text-gray-400 hover:text-orange-400 transition">Reset</button>
            <button onClick={signOut} className="text-sm font-bold text-gray-400 hover:text-red-400 transition">Sign Out</button>
          </div>
        </div>

        {/* Top-up banner */}
        {toppedUp && (
          <div className="bg-amber-50 border-2 border-amber-200 text-amber-700 font-bold text-sm px-4 py-3 rounded-2xl mb-6 text-center">
            You ran out of coins! Here's 10 to get back in the game 🪙
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

          {/* Topics column */}
          <div className={`md:col-span-2 ${selectedTopic ? 'hidden md:block' : 'block'}`}>
            <h2 className="text-lg font-black text-gray-700 mb-3">Pick a Topic</h2>
            <div className="space-y-2">
              {topics.map(topic => {
                const s = TOPIC_STYLES[topic.name] ?? DEFAULT_STYLE
                const p = topicProgress[topic.id]
                const isSelected = selectedTopic?.id === topic.id
                const done = p && p.subtopicsWithQuestions > 0 && p.subtopicsDone === p.subtopicsWithQuestions
                const pct = p && p.total > 0 ? Math.round((p.completed / p.total) * 100) : null

                return (
                  <button
                    key={topic.id}
                    onClick={() => !done && handleTopicSelect(topic)}
                    disabled={done}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition ${
                      done
                        ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? `${s.bg} ${s.border} shadow-sm`
                        : `bg-white border-gray-100 hover:${s.bg} hover:${s.border} cursor-pointer`
                    }`}
                  >
                    <span className="text-2xl shrink-0">{done ? '✅' : s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm ${done ? 'text-gray-400' : isSelected ? s.text : 'text-gray-700'}`}>
                        {topic.name}
                      </p>
                      {pct !== null && (
                        <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: done ? '#9ca3af' : s.bar }}
                          />
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${done ? 'text-gray-400' : isSelected ? s.text : 'text-gray-400'}`}>
                      {done ? 'Done!' : pct !== null ? `${pct}%` : ''}
                    </span>
                    {!done && (
                      <span className={`shrink-0 font-black ${isSelected ? s.text : 'text-gray-300'}`}>›</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subtopics column */}
          <div className={`md:col-span-3 ${!selectedTopic ? 'hidden md:flex md:items-center md:justify-center' : 'block'}`}>
            {selectedTopic ? (
              <div>
                {/* Mobile back button */}
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="md:hidden text-gray-400 font-bold text-sm mb-4 hover:text-gray-600 transition"
                >
                  ← Back
                </button>

                {/* Topic header */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${style.bg} border-2 ${style.border} mb-3`}>
                  <span className="text-2xl">{style.emoji}</span>
                  <div>
                    <p className={`font-black ${style.text}`}>{selectedTopic.name}</p>
                    <p className={`text-xs font-bold opacity-60 ${style.text}`}>Select a subtopic to play</p>
                  </div>
                </div>

                {/* Subtopic list */}
                <div className="space-y-2">
                  {subtopics.map(sub => {
                    const p = subtopicProgress[sub.id]
                    const total = p?.total ?? 0
                    const completed = p?.completed ?? 0
                    const done = total > 0 && completed === total
                    const pct = total > 0 ? Math.round((completed / total) * 100) : null

                    return (
                      <button
                        key={sub.id}
                        onClick={() => !done && navigate('/bet', { state: { subtopic: sub, topic: selectedTopic, coins } })}
                        disabled={done}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border-2 text-left transition ${
                          done
                            ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                            : `bg-white border-gray-100 hover:${style.bg} hover:${style.border} cursor-pointer`
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`font-black text-sm ${done ? 'text-gray-400' : 'text-gray-700'}`}>
                            {done ? '✅ ' : ''}{sub.name}
                          </p>
                          {pct !== null && (
                            <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: done ? '#9ca3af' : style.bar }}
                              />
                            </div>
                          )}
                          {total === 0 && (
                            <p className="text-xs text-gray-400 font-bold mt-0.5">No questions yet</p>
                          )}
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${done ? 'text-gray-400' : 'text-gray-400'}`}>
                          {done ? 'Done!' : pct !== null ? `${completed}/${total}` : ''}
                        </span>
                        {!done && total > 0 && (
                          <span className={`shrink-0 font-black ${style.text}`}>›</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center h-64 rounded-3xl border-2 border-dashed border-gray-200">
                <span className="text-4xl mb-3">👈</span>
                <p className="text-gray-400 font-bold">Select a topic to see subtopics</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
