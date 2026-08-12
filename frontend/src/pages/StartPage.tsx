import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import LanguageToggle from '../components/LanguageToggle'
import { useI18n } from '../i18n'

export default function StartPage() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <nav className="px-6 py-2 max-w-7xl mx-auto flex items-center justify-between">
        <img src="/logo.png" alt="SpeechCoach AI" className="h-64 w-auto -ml-6" />
        <div className="flex items-center gap-4">
          <span className="text-xs text-sky-500/80 font-medium">v5.0 · Demo</span>
          <LanguageToggle />
          {user ? (
            <>
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
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-blue-700"
              >
                {t('common.login')}
              </Link>
              <Link
                to="/signup"
                className="text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-700 px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                {t('common.signup')}
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-2 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-sky-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              {t('start.badge')}
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 bg-clip-text text-transparent">
                {t('start.heroTitleEm')}
              </span>
              {t('start.heroTitleAfterEm')}
              <br />
              {t('start.heroTitleLine2')}
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              <span className="font-semibold text-blue-700">{t('start.heroDescEm1')}</span>
              {t('start.heroDesc1')}
              <br />
              {t('start.heroDesc2')}{' '}
              <span className="font-semibold text-sky-700">
                {t('start.heroDescEm2')}
              </span>
              {t('start.heroDesc3')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-3">
              <Link
                to="/onboarding"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-sky-300/60 hover:-translate-y-0.5 transition-all"
              >
                {t('start.ctaStart')}
                <svg
                  className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <span className="text-sm text-slate-600 self-center">
                {t('start.ctaTimeA')}<span className="font-bold text-blue-700">{t('start.ctaTimeEm')}</span>{t('start.ctaTimeB')}
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
              <Check>
                {t('start.check1a')} <span className="font-semibold text-blue-700">{t('start.check1em')}</span>
              </Check>
              <Check>
                {t('start.check2a')} <span className="font-bold text-blue-700">{t('start.check2em')}</span>
              </Check>
              <Check>
                <span className="font-bold text-blue-700">Claude AI</span> {t('start.check3b')}
              </Check>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-br from-sky-300 via-sky-200 to-sky-300 rounded-[3rem] blur-3xl opacity-40" />
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-sky-200/40 p-7 border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-400">{t('start.previewOverall')}</span>
                <span className="text-xs text-blue-600 font-medium">{t('start.previewLabel')}</span>
              </div>
              <div className="flex items-end gap-2 mb-7">
                <span className="text-6xl font-bold bg-gradient-to-br from-sky-500 via-blue-600 to-blue-800 bg-clip-text text-transparent tracking-tighter">
                  85
                </span>
                <span className="text-slate-400 mb-3 text-lg">/100</span>
              </div>
              <div className="space-y-4">
                <ScoreRow label={t('start.scoreContent')} value={88} from="from-sky-400" to="to-blue-600" />
                <ScoreRow label={t('start.scoreNonverbal')} value={75} from="from-sky-500" to="to-cyan-500" />
                <ScoreRow label={t('start.scoreParaverbal')} value={82} from="from-emerald-500" to="to-teal-500" />
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="text-xs text-slate-400 mb-2.5 font-medium">{t('start.previewImprovement')}</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-100">
                    HIGH
                  </span>
                  <span className="text-slate-700 font-medium">{t('start.previewTip')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-28 grid md:grid-cols-3 gap-5">
          <FeatureCard
            tag="STEP 01"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            }
            title={t('start.feature1Title')}
            desc={
              <>
                {t('start.feature1a')}{' '}
                <strong className="font-semibold text-blue-700">Claude AI</strong>
                {t('start.feature1b')}
              </>
            }
          />
          <FeatureCard
            tag="STEP 02"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M7 14l4-4 4 4 5-5" />
              </svg>
            }
            title={t('start.feature2Title')}
            desc={
              <>
                <strong className="font-semibold text-blue-700">MediaPipe</strong>
                {t('start.feature2a')}{' '}
                <strong className="font-semibold text-sky-700">
                  {t('start.feature2em')}
                </strong>
                {t('start.feature2b')}
              </>
            }
          />
          <FeatureCard
            tag="STEP 03"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
              </svg>
            }
            title={t('start.feature3Title')}
            desc={
              <>
                {t('start.feature3a')}{' '}
                <strong className="font-semibold text-sky-700">
                  {t('start.feature3em')}
                </strong>
                {t('start.feature3b')}
              </>
            }
          />
        </div>
      </main>

    </div>
  )
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      {children}
    </span>
  )
}

function ScoreRow({
  label,
  value,
  from,
  to,
}: {
  label: string
  value: number
  from: string
  to: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{value}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${from} ${to} rounded-full`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  tag,
  title,
  desc,
}: {
  icon: React.ReactNode
  tag?: string
  title: string
  desc: React.ReactNode
}) {
  return (
    <div className="group relative bg-white rounded-2xl p-7 border border-slate-100 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/60 hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 text-blue-700 flex items-center justify-center shadow-sm shadow-sky-200/40 group-hover:scale-110 transition-transform">
          <div className="w-6 h-6">{icon}</div>
        </div>
        {tag && (
          <span className="text-[10px] font-bold tracking-[0.18em] text-sky-600/80 bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
            {tag}
          </span>
        )}
      </div>
      <h3 className="font-bold text-lg text-slate-900 mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  )
}

