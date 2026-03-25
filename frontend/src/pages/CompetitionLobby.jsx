import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { get, post } from '../lib/api'

export default function CompetitionLobby() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tab, setTab] = useState('create') // 'create' | 'join'
  const [coins, setCoins] = useState(null)
  const [topics, setTopics] = useState([])
  const [subtopics, setSubtopics] = useState([])

  // Create form
  const [selectedSubtopic, setSelectedSubtopic] = useState(null)
  const [bet, setBet] = useState('')
  const [createError, setCreateError] = useState(null)
  const [creating, setCreating] = useState(false)

  // Join form
  const [code, setCode] = useState('')
  const [roomPreview, setRoomPreview] = useState(null)
  const [joinError, setJoinError] = useState(null)
  const [joining, setJoining] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)

  useEffect(() => {
    get(`/game/profile/${user.id}`).then(data => setCoins(data.coins))
    get('/topics/').then(setTopics)
    get('/topics/all-subtopics').then(setSubtopics)
  }, [user.id])

  const subtopicsByTopic = topics.map(t => ({
    ...t,
    subtopics: subtopics.filter(s => s.topic_id === t.id),
  }))

  async function handleCreate(e) {
    e.preventDefault()
    if (!selectedSubtopic) return setCreateError('Select a subtopic.')
    const amount = parseInt(bet)
    if (!amount || amount < 1) return setCreateError('Enter a valid bet.')
    if (amount > coins) return setCreateError("You don't have enough coins.")
    setCreating(true)
    setCreateError(null)
    try {
      const data = await post('/competitions/create', {
        user_id: user.id,
        subtopic_id: selectedSubtopic.id,
        bet: amount,
      })
      navigate('/competition/game', {
        state: {
          room_code: data.room_code,
          subtopic_name: data.subtopic_name,
          bet: data.bet,
          role: 'creator',
        },
      })
    } catch (err) {
      const body = JSON.parse(err.message)
      setCreateError(body?.detail ?? 'Something went wrong.')
      setCreating(false)
    }
  }

  async function lookUpRoom() {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) return
    setLookingUp(true)
    setJoinError(null)
    setRoomPreview(null)
    try {
      const data = await get(`/competitions/room/${trimmed}`)
      setRoomPreview(data)
    } catch {
      setJoinError('Room not found or already started.')
    }
    setLookingUp(false)
  }

  async function handleJoin() {
    if (!roomPreview) return
    if (coins < roomPreview.bet) return setJoinError("You don't have enough coins.")
    setJoining(true)
    setJoinError(null)
    try {
      const data = await post('/competitions/join', {
        user_id: user.id,
        room_code: roomPreview.room_code,
      })
      navigate('/competition/game', {
        state: {
          room_code: data.room_code,
          subtopic_name: data.subtopic_name,
          bet: data.bet,
          role: 'joiner',
        },
      })
    } catch (err) {
      const body = JSON.parse(err.message)
      setJoinError(body?.detail ?? 'Something went wrong.')
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center p-6 pt-10 pb-24">
      <div className="w-full max-w-md">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-[var(--color-primary)]">⚔️ Competition</h1>
          <div className="flex items-center gap-1">
            <span>🪙</span>
            <span className="font-black text-[var(--color-gold)]">{coins?.toLocaleString() ?? '...'}</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
          {['create', 'join'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl font-black text-sm transition ${
                tab === t ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-400'
              }`}
            >
              {t === 'create' ? '🏠 Create Room' : '🔗 Join Room'}
            </button>
          ))}
        </div>

        {tab === 'create' && (
          <form onSubmit={handleCreate} className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">
                Pick a Subtopic
              </label>
              {subtopicsByTopic.map(topic => (
                topic.subtopics.length > 0 && (
                  <div key={topic.id} className="mb-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-1">{topic.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {topic.subtopics.map(s => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => { setSelectedSubtopic(s); setCreateError(null) }}
                          className={`text-left px-3 py-2 rounded-xl border-2 text-sm font-bold transition ${
                            selectedSubtopic?.id === s.id
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                              : 'border-gray-100 text-gray-600 hover:border-gray-200'
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">
                Bet (each player pays this)
              </label>
              <input
                type="number"
                min="1"
                max={coins ?? undefined}
                value={bet}
                onChange={e => { setBet(e.target.value); setCreateError(null) }}
                placeholder="0"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-2xl font-black text-center focus:outline-none focus:border-[var(--color-primary)] transition"
              />
              <p className="text-xs text-gray-400 font-bold mt-1 text-center">Winner takes the pot · net gain = your bet amount</p>
            </div>

            {createError && (
              <div className="bg-red-50 text-red-600 text-sm font-bold px-4 py-2 rounded-xl text-center">
                {createError}
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl font-black text-lg disabled:opacity-40"
            >
              {creating ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        )}

        {tab === 'join' && (
          <div className="bg-white rounded-3xl shadow-sm p-6 space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wide mb-2">
                Room Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={e => {
                    setCode(e.target.value.toUpperCase())
                    setRoomPreview(null)
                    setJoinError(null)
                  }}
                  placeholder="ABC123"
                  className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-3 text-xl font-black text-center tracking-widest focus:outline-none focus:border-[var(--color-primary)] transition uppercase"
                />
                <button
                  type="button"
                  onClick={lookUpRoom}
                  disabled={code.trim().length !== 6 || lookingUp}
                  className="bg-[var(--color-primary)] text-white px-4 rounded-xl font-black disabled:opacity-40"
                >
                  {lookingUp ? '...' : 'Find'}
                </button>
              </div>
            </div>

            {roomPreview && (
              <div className="bg-[var(--color-primary-light)] border-2 border-[var(--color-primary)] rounded-2xl p-4 space-y-1">
                <p className="text-xs font-black text-[var(--color-primary)] uppercase tracking-wide">Room Found</p>
                <p className="font-black text-gray-800">{roomPreview.subtopic_name}</p>
                <p className="text-sm font-bold text-gray-500">
                  Created by <span className="text-gray-700">{roomPreview.creator_username}</span>
                </p>
                <p className="text-sm font-bold text-[var(--color-primary)]">
                  Bet: {roomPreview.bet.toLocaleString()} 🪙 each · Win: +{roomPreview.bet.toLocaleString()} 🪙 net
                </p>
                {coins !== null && coins < roomPreview.bet && (
                  <p className="text-sm font-bold text-red-500">You don't have enough coins.</p>
                )}
              </div>
            )}

            {joinError && (
              <div className="bg-red-50 text-red-600 text-sm font-bold px-4 py-2 rounded-xl text-center">
                {joinError}
              </div>
            )}

            {roomPreview && (
              <button
                onClick={handleJoin}
                disabled={joining || coins < roomPreview.bet}
                className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl font-black text-lg disabled:opacity-40"
              >
                {joining ? 'Joining...' : `Join & Stake ${roomPreview.bet.toLocaleString()} 🪙`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
