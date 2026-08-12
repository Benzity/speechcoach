import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n'

export default function SignupPage() {
  const { signup } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 4) {
      setError(t('auth.passwordTooShort'))
      return
    }
    setSubmitting(true)
    try {
      await signup(email.trim(), password, displayName.trim() || undefined)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-6">
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-sky-500 to-blue-700 bg-clip-text text-transparent">
            SpeechCoach
          </span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl shadow-sky-100/40 p-8 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">
            {t('auth.signupTitle')}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {t('auth.signupSubtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Field
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={t('auth.passwordPlaceholder')}
              autoComplete="new-password"
              required
            />
            <Field
              label={t('auth.displayName')}
              type="text"
              value={displayName}
              onChange={setDisplayName}
              placeholder={t('auth.displayNamePlaceholder')}
            />

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-sky-300/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? t('auth.signupSubmitting') : t('auth.signupSubmit')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="font-semibold text-blue-700 hover:underline">
              {t('auth.loginLink')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition"
      />
    </label>
  )
}
