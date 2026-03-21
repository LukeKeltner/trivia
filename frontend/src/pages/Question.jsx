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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-lg">
        <div className="flex justify-between text-sm text-gray-500 mb-6">
          <span>{topic.name}</span>
          <span>Bet: <span className="font-semibold text-yellow-500">{bet} coins</span></span>
        </div>

        {!question ? (
          <p className="text-center text-gray-400">Loading question...</p>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{question.question_text}</h2>

            <div className="space-y-3">
              {question.answers.map(answer => (
                <button
                  key={answer.id}
                  onClick={() => setSelected(answer)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                    selected?.id === answer.id
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  {answer.answer_text}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selected || submitting}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
