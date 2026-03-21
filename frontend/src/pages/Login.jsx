import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (isSignUp) {
      if (!username.trim()) { setError('Please choose a username.'); setLoading(false); return }
      const { data, error } = await signUp(email, password)
      if (error) { setError(error.message); setLoading(false); return }
      await fetch(`${API_URL}/game/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id, username: username.trim() }),
      })
    } else {
      const { error } = await signIn(email, password)
      if (error) { setError(error.message); setLoading(false); return }
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🧠</div>
        <h1 className="text-4xl font-black text-[var(--color-primary)]">Trivia</h1>
        <p className="text-gray-500 mt-1 font-semibold">Test your knowledge. Win coins.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm">
        <h2 className="text-xl font-black text-gray-800 mb-6 text-center">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(null) }}
              required
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-[var(--color-primary)] transition"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-[var(--color-primary)] transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:border-[var(--color-primary)] transition"
          />

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-3 rounded-xl font-black text-lg transition disabled:opacity-50"
          >
            {loading ? '...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 font-semibold mt-5">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
            className="text-[var(--color-primary)] hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}
