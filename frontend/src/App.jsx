import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import Login from './pages/Login'
import Home from './pages/Home'
import Bet from './pages/Bet'
import Question from './pages/Question'
import Result from './pages/Result'
import Leaderboard from './pages/Leaderboard'
import Store from './pages/Store'
import Subtopics from './pages/Subtopics'

const NAV_ROUTES = ['/', '/leaderboard', '/store']

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  if (loading) return null

  const showNav = user && NAV_ROUTES.includes(pathname)

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/subtopics" element={<ProtectedRoute><Subtopics /></ProtectedRoute>} />
        <Route path="/bet" element={<ProtectedRoute><Bet /></ProtectedRoute>} />
        <Route path="/question" element={<ProtectedRoute><Question /></ProtectedRoute>} />
        <Route path="/result" element={<ProtectedRoute><Result /></ProtectedRoute>} />
        <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
