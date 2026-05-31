import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-slate-100 bg-white/70 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
          <span className="bg-gradient-to-r from-sky-500 to-blue-700 bg-clip-text text-transparent">
            SpeechCoach
          </span>
          <span className="text-[10px] text-sky-500/80 font-medium">v4.0</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/history"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              내 면접 기록
            </Link>
            <span className="text-sm text-slate-500">
              {user.display_name ?? user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-700">
              로그인
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-700 px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              회원가입
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
