import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const BASE_WS_URL = import.meta.env.VITE_API_URL
  .replace('https://', 'wss://')
  .replace('http://', 'ws://')

export default function CompetitionGame() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { room_code, subtopic_name, bet } = state ?? {}

  const [phase, setPhase] = useState('connecting') // connecting | waiting | playing | finished
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [myProgress, setMyProgress] = useState(0)
  const [opponentProgress, setOpponentProgress] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [opponentUsername, setOpponentUsername] = useState('Opponent')
  const [penaltyRemaining, setPenaltyRemaining] = useState(0)
  const [result, setResult] = useState(null) // {you_win, coins}
  const [wsError, setWsError] = useState(null)

  const wsRef = useRef(null)
  const penaltyInterval = useRef(null)

  useEffect(() => {
    if (!room_code || !user) {
      navigate('/competition')
      return
    }

    let ws = null

    async function connect() {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const url = `${BASE_WS_URL}/competitions/ws/${room_code}/${user.id}?token=${token}`
      ws = new WebSocket(url)
      wsRef.current = ws

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)

        if (msg.type === 'waiting') {
          setPhase('waiting')
        }

        if (msg.type === 'game_start') {
          setQuestions(msg.questions)
          setTotalQuestions(msg.total_questions)
          setOpponentUsername(msg.opponent_username)
          setPhase('playing')
        }

        if (msg.type === 'answer_result') {
          setSubmitting(false)
          setSelected(null)
          if (msg.correct) {
            setMyProgress(msg.questions_done)
            setCurrentQ(msg.questions_done)
          } else {
            // Start penalty countdown
            let remaining = msg.penalty_seconds
            setPenaltyRemaining(remaining)
            clearInterval(penaltyInterval.current)
            penaltyInterval.current = setInterval(() => {
              remaining -= 0.1
              if (remaining <= 0) {
                clearInterval(penaltyInterval.current)
                setPenaltyRemaining(0)
              } else {
                setPenaltyRemaining(remaining)
              }
            }, 100)
          }
        }

        if (msg.type === 'opponent_progress') {
          setOpponentProgress(msg.questions_done)
        }

        if (msg.type === 'game_over') {
          clearInterval(penaltyInterval.current)
          setResult({ you_win: msg.you_win, coins: msg.coins })
          setPhase('finished')
        }

        if (msg.type === 'opponent_disconnected') {
          clearInterval(penaltyInterval.current)
          setResult({ you_win: true, coins: msg.coins, disconnected: true })
          setPhase('finished')
        }
      }

      ws.onerror = () => setWsError('Connection error. Please try again.')
      ws.onclose = (e) => {
        if (e.code === 4001) setWsError('Authentication failed.')
        else if (e.code === 4003) setWsError('Not authorized for this room.')
        else if (e.code === 4004) setWsError('Room not found.')
      }
    }

    connect()

    return () => {
      clearInterval(penaltyInterval.current)
      if (ws) ws.close()
    }
  }, [])

  function sendAnswer(answerId) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (submitting || penaltyRemaining > 0) return
    setSelected(answerId)
    setSubmitting(true)
    wsRef.current.send(JSON.stringify({ type: 'answer', answer_id: answerId }))
  }

  if (wsError) {
    return (
      <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-sm w-full">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="font-black text-gray-800 text-lg mb-2">Connection Failed</p>
          <p className="text-gray-500 font-bold text-sm mb-6">{wsError}</p>
          <button onClick={() => navigate('/competition')} className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-black">
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'connecting') {
    return (
      <div className="min-h-screen bg-[var(--color-game-bg)] flex items-center justify-center">
        <p className="font-black text-[var(--color-primary)] text-lg animate-pulse">Connecting...</p>
      </div>
    )
  }

  if (phase === 'waiting') {
    return (
      <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-sm w-full">
          <p className="text-5xl mb-4 animate-bounce">⏳</p>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Waiting for opponent</h2>
          <p className="text-gray-500 font-bold text-sm mb-6">{subtopic_name}</p>
          <div className="bg-[var(--color-primary-light)] border-2 border-[var(--color-primary)] rounded-2xl px-6 py-4 mb-6">
            <p className="text-xs font-black text-[var(--color-primary)] uppercase tracking-wide mb-1">Room Code</p>
            <p className="text-4xl font-black text-[var(--color-primary)] tracking-widest">{room_code}</p>
            <p className="text-xs text-[var(--color-primary)] font-bold mt-1 opacity-70">Share this with your opponent</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-400 font-bold text-sm">Bet:</span>
            <span className="font-black text-[var(--color-gold)]">{bet?.toLocaleString()} 🪙</span>
            <span className="text-gray-400 font-bold text-sm">each · Win</span>
            <span className="font-black text-[var(--color-gold)]">{(bet * 2)?.toLocaleString()} 🪙</span>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'finished' && result) {
    return (
      <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-sm p-8 text-center max-w-sm w-full">
          <p className="text-6xl mb-4">{result.you_win ? '🏆' : '😔'}</p>
          <h2 className={`text-3xl font-black mb-2 ${result.you_win ? 'text-[var(--color-primary)]' : 'text-gray-500'}`}>
            {result.you_win ? 'You Win!' : 'You Lose'}
          </h2>
          {result.disconnected && (
            <p className="text-sm font-bold text-gray-400 mb-3">Your opponent disconnected.</p>
          )}
          {result.you_win && result.coins !== null && (
            <div className="bg-[var(--color-gold-light)] rounded-2xl px-4 py-3 mb-6">
              <p className="text-xs font-black text-[var(--color-gold)] uppercase tracking-wide mb-1">New Balance</p>
              <p className="text-3xl font-black text-[var(--color-gold)]">🪙 {result.coins?.toLocaleString()}</p>
            </div>
          )}
          {!result.you_win && (
            <p className="text-sm font-bold text-gray-400 mb-6">
              You lost <span className="text-red-500">{bet?.toLocaleString()} 🪙</span>
            </p>
          )}
          <button
            onClick={() => navigate('/competition')}
            className="w-full bg-[var(--color-primary)] text-white py-4 rounded-xl font-black text-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    )
  }

  if (phase !== 'playing' || questions.length === 0) return null

  const question = questions[currentQ]
  const inPenalty = penaltyRemaining > 0
  const letters = ['A', 'B', 'C', 'D']

  return (
    <div className="min-h-screen bg-[var(--color-game-bg)] flex flex-col items-center p-4 pt-6 pb-8">
      <div className="w-full max-w-lg">

        {/* Progress bars */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 space-y-3">
          {/* My progress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-[var(--color-primary)]">You</span>
              <span className="text-xs font-bold text-gray-400">{myProgress}/{totalQuestions}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                style={{ width: totalQuestions ? `${(myProgress / totalQuestions) * 100}%` : '0%' }}
              />
            </div>
          </div>
          {/* Opponent progress */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-gray-500">{opponentUsername}</span>
              <span className="text-xs font-bold text-gray-400">{opponentProgress}/{totalQuestions}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-400 rounded-full transition-all duration-300"
                style={{ width: totalQuestions ? `${(opponentProgress / totalQuestions) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        {/* Penalty overlay */}
        {inPenalty && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-3 mb-4 text-center">
            <p className="font-black text-red-600 text-sm">
              Wrong answer — retry in {penaltyRemaining.toFixed(1)}s
            </p>
            <div className="h-2 bg-red-100 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-red-400 rounded-full transition-none"
                style={{ width: `${(penaltyRemaining / 10) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Question card */}
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wide">{subtopic_name}</span>
            <span className={`text-xs font-black px-2 py-1 rounded-lg ${
              question.difficulty === 'hard' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-600'
            }`}>
              {question.difficulty === 'hard' ? '🔥 Hard' : 'Easy'}
            </span>
          </div>

          <h2 className="text-lg font-black text-gray-800 mb-6 leading-snug">
            {question.question_text}
          </h2>

          <div className="space-y-3">
            {question.answers.map((answer, i) => {
              const isSelected = selected === answer.id
              const disabled = submitting || inPenalty
              return (
                <button
                  key={answer.id}
                  onClick={() => !disabled && sendAnswer(answer.id)}
                  disabled={disabled}
                  className={`w-full text-left px-4 py-4 rounded-2xl border-2 font-bold transition flex items-center gap-3 ${
                    isSelected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : disabled
                      ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
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
        </div>

        {/* Bet reminder */}
        <p className="text-center text-xs font-bold text-gray-400 mt-4">
          🪙 {(bet * 2)?.toLocaleString()} coins to the winner
        </p>
      </div>
    </div>
  )
}
