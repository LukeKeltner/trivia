import { useLocation, useNavigate } from 'react-router-dom'

export default function Result() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { result, bet, topic } = state ?? {}

  if (!result) {
    navigate('/')
    return null
  }

  const { is_correct, coins } = result

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-6 p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-sm text-center">
        <div className="text-6xl mb-4">{is_correct ? '🎉' : '😞'}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {is_correct ? 'Correct!' : 'Wrong!'}
        </h2>
        <p className="text-gray-500 mb-6">
          {is_correct
            ? `You won ${bet} coins!`
            : `You lost ${bet} coins.`}
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">New Balance</p>
          <p className="text-4xl font-bold text-yellow-500">{coins} <span className="text-xl">coins</span></p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/bet', { state: { topic, coins } })}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Play Again
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full text-sm text-gray-400 hover:text-gray-600"
          >
            Change Topic
          </button>
        </div>
      </div>
    </div>
  )
}
