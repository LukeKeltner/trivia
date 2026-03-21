import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Bet() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { topic, coins } = state ?? {}
  const [bet, setBet] = useState('')
  const [error, setError] = useState(null)

  if (!topic) {
    navigate('/')
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    const amount = parseInt(bet)
    if (!amount || amount <= 0) return setError('Enter a valid bet.')
    if (amount > coins) return setError("You don't have enough coins.")
    navigate('/question', { state: { topic, coins, bet: amount } })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-1">{topic.name}</h2>
        <p className="text-gray-500 text-sm mb-6">Balance: <span className="font-semibold text-yellow-500">{coins} coins</span></p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">How many coins do you want to bet?</label>
            <input
              type="number"
              min="1"
              max={coins}
              value={bet}
              onChange={e => { setBet(e.target.value); setError(null) }}
              placeholder="e.g. 10"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Place Bet
          </button>
        </form>

        <button onClick={() => navigate('/')} className="mt-4 w-full text-sm text-gray-400 hover:text-gray-600">
          Back
        </button>
      </div>
    </div>
  )
}
