import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { post } from '../lib/api'

function getMultiplier(elapsed) {
  return Math.max(0.25, 1.0 - Math.max(0, elapsed - 5) * 0.05)
}

function MultiplierColor(multiplier) {
  if (multiplier >= 1.0) return 'text-green-600 bg-green-50 border-green-200'
  if (multiplier >= 0.75) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  if (multiplier >= 0.5) return 'text-orange-500 bg-orange-50 border-orange-200'
  return 'text-red-500 bg-red-50 border-red-200'
}

export default function Question() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { subtopic, topic, coins, bet, question } = state ?? {}
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startTime = useRef(Date.now())

  useEffect(() => {
    if (!topic || !question) { navigate('/'); return }
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime.current) / 1000)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  if (!topic || !question) return null

  const isHard = question.difficulty === 'hard'
  const multiplier = getMultiplier(elapsed)
  const effectiveWin = Math.round(bet * multiplier)

  async function handleSubmit() {
    if (!selected || submitting) return
    setSubmitting(true)
    try {
      const result = await post('/game/submit', {
        user_id: user.id,
        question_id: question.id,
        chosen_answer_id: selected.id,
        bet,
        question_token: question.question_token,
      })
      navigate('/result', { state: { result, bet, subtopic, topic, elapsed } })
    } catch (err) {
      setSubmitting(false)
      setSelected(null)
      alert(JSON.parse(err.message)?.detail ?? 'Something went wrong.')
    }
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors ${isHard ? 'hard-question-bg' : 'bg-[var(--color-game-bg)]'}`}>
      <div className="w-full max-w-lg">

        {/* Meta bar */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-white border-2 border-gray-100 text-gray-600 font-black text-sm px-4 py-2 rounded-full">
              {topic.name}
            </span>
            {isHard && (
              <span className="bg-red-500 text-white font-black text-sm px-3 py-2 rounded-full animate-pulse">
                🔥 HARD
              </span>
            )}
          </div>
          <span className="bg-[var(--color-gold-light)] text-[var(--color-gold)] font-black text-sm px-4 py-2 rounded-full">
            🪙 {bet?.toLocaleString()} on the line
          </span>
        </div>

        {/* Timer + multiplier bar */}
        <div className="flex justify-between items-center mb-4 bg-white rounded-2xl px-4 py-2 border-2 border-gray-100">
          <span className="text-gray-400 font-black text-sm">⏱ {elapsed.toFixed(1)}s</span>
          <span className={`font-black text-sm px-3 py-1 rounded-xl border-2 ${MultiplierColor(multiplier)}`}>
            Win: {Math.round(multiplier * 100)}% · 🪙 {effectiveWin.toLocaleString()}
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h2 className="text-xl font-black text-gray-800 mb-8 leading-snug">
            {question.question_text}
          </h2>

          <div className="space-y-3 mb-8">
            {question.answers.map((answer, i) => {
              const letters = ['A', 'B', 'C', 'D']
              const isSelected = selected?.id === answer.id
              return (
                <button
                  key={answer.id}
                  onClick={() => setSelected(answer)}
                  className={`w-full text-left px-4 py-4 rounded-2xl border-2 font-bold transition flex items-center gap-3 ${
                    isSelected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'border-gray-100 hover:border-[var(--color-primary-light)] hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                    isSelected ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {letters[i] ?? i + 1}
                  </span>
                  {answer.answer_text}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-4 rounded-xl font-black text-lg transition disabled:opacity-40"
          >
            {submitting ? 'Submitting...' : 'Lock In Answer 🔒'}
          </button>
        </div>
      </div>
    </div>
  )
}
