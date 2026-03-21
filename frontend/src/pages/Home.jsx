import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { get } from '../lib/api'

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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-8 p-6">
      <div className="w-full max-w-md flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Trivia</h1>
        <button onClick={signOut} className="text-sm text-gray-500 hover:text-red-500">
          Sign Out
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-6 w-full max-w-md text-center">
        <p className="text-gray-500 text-sm">Your Balance</p>
        <p className="text-5xl font-bold text-yellow-500 mt-1">
          {coins ?? '...'} <span className="text-2xl">coins</span>
        </p>
      </div>

      <div className="w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Pick a Topic</h2>
        <div className="grid grid-cols-2 gap-4">
          {topics.map(topic => (
            <button
              key={topic.id}
              onClick={() => selectTopic(topic)}
              className="bg-white rounded-xl shadow p-6 text-center font-semibold text-gray-800 hover:bg-blue-50 hover:shadow-md transition"
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
