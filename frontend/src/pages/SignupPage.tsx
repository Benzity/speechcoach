import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n'

// 서버(app/services/password_policy.py)와 값을 맞춰야 한다.
const MIN_PASSWORD_LENGTH = 8

export default function SignupPage() {
  const { signup } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [consentOverseas, setConsentOverseas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const allConsented = consentPrivacy && consentOverseas

  function toggleAll(checked: boolean) {
    setConsentPrivacy(checked)
    setConsentOverseas(checked)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('auth.passwordTooShort'))
      return
    }
    if (!birthDate) {
      setError(t('auth.birthDateRequired'))
      return
    }
    if (!allConsented) {
      setError(t('auth.consentRequired'))
      return
    }
    setSubmitting(true)
    try {
      await signup(
        email.trim(),
        password,
        birthDate,
        { privacy: consentPrivacy, overseas: consentOverseas },
        displayName.trim() || undefined,
      )
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
              hint={t('auth.passwordHint')}
            />
            <Field
              label={t('auth.birthDate')}
              type="date"
              value={birthDate}
              onChange={setBirthDate}
              autoComplete="bday"
              required
              hint={t('auth.birthDateHint')}
            />
            <Field
              label={t('auth.displayName')}
              type="text"
              value={displayName}
              onChange={setDisplayName}
              placeholder={t('auth.displayNamePlaceholder')}
            />

            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allConsented}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                />
                <span className="text-sm font-semibold text-slate-800">
                  {t('auth.consentAgreeAll')}
                </span>
              </label>

              {/* 개인정보보호위원회 「알기쉬운 개인정보 처리 동의 안내서」(2022.3)
                  4요소: 수집 항목 · 수집 목적 · 보유 및 이용기간 · 동의 거부 시 불이익.
                  항목은 '~등'으로 뭉뚱그리지 않고 구체적으로 나열해야 한다. */}
              <ConsentRow
                checked={consentPrivacy}
                onChange={setConsentPrivacy}
                label={t('auth.consentPrivacyLabel')}
              >
                <ConsentField label={t('auth.fieldItems')}>
                  {t('auth.privacyItems')}
                </ConsentField>
                <ConsentField label={t('auth.fieldPurpose')}>
                  {t('auth.privacyPurpose')}
                </ConsentField>
                <ConsentField label={t('auth.fieldRetention')}>
                  {t('auth.privacyRetention')}
                </ConsentField>
                <ConsentField label={t('auth.fieldRefusal')}>
                  {t('auth.privacyRefusal')}
                </ConsentField>
              </ConsentRow>

              <ConsentRow
                checked={consentOverseas}
                onChange={setConsentOverseas}
                label={t('auth.consentOverseasLabel')}
              >
                <ConsentField label={t('auth.fieldReceiver')}>
                  {t('auth.overseasReceiver')}
                </ConsentField>
                <ConsentField label={t('auth.fieldTransferContact')}>
                  {t('auth.overseasContact')}
                </ConsentField>
                <ConsentField label={t('auth.fieldTransferItems')}>
                  {t('auth.overseasItems')}
                </ConsentField>
                <ConsentField label={t('auth.fieldTransferWhen')}>
                  {t('auth.overseasWhen')}
                </ConsentField>
                <ConsentField label={t('auth.fieldTransferPurpose')}>
                  {t('auth.overseasPurpose')}
                </ConsentField>
                <ConsentField label={t('auth.fieldRetention')}>
                  {t('auth.overseasRetention')}
                </ConsentField>
                <ConsentField label={t('auth.fieldRefusal')}>
                  {t('auth.overseasRefusal')}
                </ConsentField>
              </ConsentRow>

              <div className="px-4 py-3">
                <Link
                  to="/privacy"
                  target="_blank"
                  className="text-xs text-blue-700 hover:underline"
                >
                  {t('auth.privacyPolicyLink')}
                </Link>
              </div>
            </div>

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !allConsented}
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
  hint,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  hint?: string
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
      {hint && <span className="text-xs text-slate-400 mt-1 block">{hint}</span>}
    </label>
  )
}

function ConsentRow({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-400 shrink-0"
        />
        <span className="text-sm font-medium text-slate-800">{label}</span>
      </label>
      <div className="mt-2 pl-7 space-y-1.5">{children}</div>
    </div>
  )
}

/** 동의 안내서가 요구하는 항목별 고지를 표 형태로 보여준다. */
function ConsentField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-xs leading-relaxed">
      <span className="text-slate-400 font-medium">{label}</span>
      <p className="text-slate-600 mt-0.5">{children}</p>
    </div>
  )
}
