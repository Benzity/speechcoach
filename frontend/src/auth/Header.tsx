import { Link, useNavigate } from 'react-router-dom'
import LanguageToggle from '../components/LanguageToggle'
import { useI18n } from '../i18n'
import { useAuth } from './AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  // logout()은 서버에 토큰 무효화를 요청하므로 async다. 완료 후 이동한다.
  // 서버 호출이 실패해도 로컬 토큰은 이미 지워졌으므로 finally에서 이동한다.
  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  return (
    <header className="border-b border-slate-100 bg-white/70 backdrop-blur sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
          <span className="bg-gradient-to-r from-sky-500 to-blue-700 bg-clip-text text-transparent">
            SpeechCoach
          </span>
          <span className="text-[10px] text-sky-500/80 font-medium">v5.0</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              to="/history"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              {t('common.myHistory')}
            </Link>
            <span className="text-sm text-slate-500">
              {user.display_name ?? user.email}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors"
            >
              {t('common.logout')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-blue-700">
              {t('common.login')}
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-700 px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              {t('common.signup')}
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
