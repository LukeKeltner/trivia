import { useLocation, useNavigate } from 'react-router-dom'

export default function Result() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { result, bet, subtopic, topic } = state ?? {}

  if (!result) { navigate('/'); return null }

  const { is_correct, coins, winnings, multiplier } = result
  const speedBonus = is_correct && multiplier >= 1.0

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Result card */}
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center">

          <div className="text-7xl mb-4">{is_correct ? '🎉' : '😬'}</div>

          <h2 className={`text-3xl font-black mb-1 ${is_correct ? 'text-green-600' : 'text-red-500'}`}>
            {is_correct ? 'Correct!' : 'Wrong!'}
          </h2>

          <p className={`font-bold text-sm mb-1 ${is_correct ? 'text-green-400' : 'text-red-300'}`}>
            {is_correct ? `+${winnings} coins earned` : `-${bet} coins lost`}
          </p>

          {is_correct && !speedBonus && (
            <p className="text-xs font-bold text-orange-400 mb-6">
              {Math.round(multiplier * 100)}% multiplier — answer faster for full winnings!
            </p>
          )}
          {(!is_correct || speedBonus) && <div className="mb-6" />}

          {/* New balance */}
          <div className="bg-[var(--color-game-bg)] rounded-2xl p-5 mb-8 border-2 border-[var(--color-primary-light)]">
            <p className="text-gray-400 font-bold text-xs uppercase tracking-wide mb-1">New Balance</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">🪙</span>
              <span className="text-4xl font-black text-[var(--color-gold)]">{coins}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/bet', { state: { subtopic, topic, coins } })}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-4 rounded-xl font-black text-lg transition"
            >
              Play Again 🎲
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl font-black transition"
            >
              Change Topic
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
