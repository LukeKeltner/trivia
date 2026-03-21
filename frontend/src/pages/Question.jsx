import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { get, post } from '../lib/api'

export default function Question() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { topic, coins, bet } = state ?? {}
  const [question, setQuestion] = useState(null)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!topic) { navigate('/'); return }
    get(`/questions/random?topic_id=${topic.id}`).then(setQuestion)
  }, [topic])

  if (!topic) return null

  async function handleSubmit() {
    if (!selected || submitting) return
    setSubmitting(true)
    const result = await post('/game/submit', {
      user_id: user.id,
      question_id: question.id,
      chosen_answer_id: selected.id,
      bet,
    })
    navigate('/result', { state: { result, bet, topic } })
  }

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Meta bar */}
        <div className="flex justify-between items-center mb-6">
          <span className="bg-white border-2 border-gray-100 text-gray-600 font-black text-sm px-4 py-2 rounded-full">
            {topic.name}
          </span>
          <span className="bg-[var(--color-gold-light)] text-[var(--color-gold)] font-black text-sm px-4 py-2 rounded-full">
            🪙 {bet} on the line
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8">
          {!question ? (
            <p className="text-center text-gray-400 font-bold py-8">Loading question...</p>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
