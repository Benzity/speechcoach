import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession, type InterviewLanguage } from '../api'
import { useI18n } from '../i18n'
import DeviceTest from './DeviceTest'

type ResumeTab = 'text' | 'pdf'

// 시연용 회사별 인재상 프리셋. 자유 텍스트는 항상 선택 가능.
// 라벨/인재상 텍스트는 i18n 사전(onboarding.*)에 있고 렌더 시점에 t()로 조회한다.
const COMPANY_PRESETS: { value: string; labelKey: string; profileKey: string }[] = [
  { value: '', labelKey: 'onboarding.companyNone', profileKey: '' },
  { value: 'samsung', labelKey: 'onboarding.companySamsung', profileKey: 'onboarding.profileSamsung' },
  { value: 'skhynix', labelKey: 'onboarding.companySkhynix', profileKey: 'onboarding.profileSkhynix' },
  { value: 'lg', labelKey: 'onboarding.companyLg', profileKey: 'onboarding.profileLg' },
  { value: 'naver', labelKey: 'onboarding.companyNaver', profileKey: 'onboarding.profileNaver' },
  { value: 'kakao', labelKey: 'onboarding.companyKakao', profileKey: 'onboarding.profileKakao' },
  { value: 'coupang', labelKey: 'onboarding.companyCoupang', profileKey: 'onboarding.profileCoupang' },
  { value: 'toss', labelKey: 'onboarding.companyToss', profileKey: 'onboarding.profileToss' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const [jobTitle, setJobTitle] = useState('')
  const [resumeTab, setResumeTab] = useState<ResumeTab>('text')
  const [resumeText, setResumeText] = useState('')
  const [resumePdf, setResumePdf] = useState<File | null>(null)
  const [companyPreset, setCompanyPreset] = useState('')
  const [idealProfile, setIdealProfile] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [language, setLanguage] = useState<InterviewLanguage>(locale)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleCompanyChange(value: string) {
    setCompanyPreset(value)
    const preset = COMPANY_PRESETS.find((p) => p.value === value)
    if (preset && preset.profileKey) {
      setIdealProfile(t(preset.profileKey))
    }
  }

  const ready =
    jobTitle.trim().length > 0 &&
    ((resumeTab === 'text' && resumeText.trim().length > 0) ||
      (resumeTab === 'pdf' && resumePdf !== null))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session = await createSession({
        jobTitle,
        resumeText: resumeTab === 'text' ? resumeText : undefined,
        resumePdf: resumeTab === 'pdf' ? resumePdf ?? undefined : undefined,
        idealProfile: idealProfile.trim() || undefined,
        questionCount,
        language,
      })
      navigate(`/interview/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('onboarding.unknownError'))
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
        <div className="relative">
          <div className="absolute inset-0 bg-sky-300 rounded-full blur-2xl opacity-40 animate-pulse" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 shadow-lg shadow-sky-300/50 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
        </div>
        <p className="mt-7 text-slate-900 font-semibold">{t('onboarding.loadingTitle')}</p>
        <p className="mt-1 text-sm text-slate-500">{t('onboarding.loadingSubtitle')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <main className="max-w-3xl mx-auto px-6 pt-8 pb-16">
        <div className="mb-8">
          <span className="text-xs font-semibold text-blue-600 tracking-wider">STEP 1 OF 1</span>
          <h1 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
            {t('onboarding.title')}
          </h1>
          <p className="text-slate-500 mt-2">
            {t('onboarding.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 space-y-8">
          <DeviceTest />

          <Field label={t('onboarding.jobTitleLabel')} required>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder={t('onboarding.jobTitlePlaceholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition"
              required
            />
          </Field>

          <Field label={t('onboarding.resumeLabel')} required>
            <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-3">
              <TabButton active={resumeTab === 'text'} onClick={() => setResumeTab('text')}>
                {t('onboarding.resumeTabText')}
              </TabButton>
              <TabButton active={resumeTab === 'pdf'} onClick={() => setResumeTab('pdf')}>
                {t('onboarding.resumeTabPdf')}
              </TabButton>
            </div>
            {resumeTab === 'text' ? (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={10}
                maxLength={5000}
                placeholder={t('onboarding.resumeTextPlaceholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition resize-none text-sm leading-relaxed"
              />
            ) : (
              <label className="block bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-6 py-10 text-center hover:border-sky-400 hover:bg-sky-50/40 transition cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumePdf(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                <svg className="w-10 h-10 mx-auto text-slate-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                {resumePdf ? (
                  <p className="font-medium text-slate-900">{resumePdf.name}</p>
                ) : (
                  <>
                    <p className="font-medium text-slate-700">{t('onboarding.resumePdfDrop')}</p>
                    <p className="text-xs text-slate-500 mt-1">{t('onboarding.resumePdfMax')}</p>
                  </>
                )}
              </label>
            )}
          </Field>

          <Field label={t('onboarding.companyLabel')}>
            <select
              value={companyPreset}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition"
            >
              {COMPANY_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {t(p.labelKey)}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1.5">
              {t('onboarding.companyHint')}
            </p>
          </Field>

          <Field label={t('onboarding.idealLabel')}>
            <textarea
              value={idealProfile}
              onChange={(e) => setIdealProfile(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={t('onboarding.idealPlaceholder')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition resize-none text-sm leading-relaxed"
            />
            <p className="text-xs text-slate-400 mt-1.5">{t('onboarding.idealHint')}</p>
          </Field>

          <Field label={t('onboarding.questionCountLabel', { count: questionCount })}>
            <input
              type="range"
              min={3}
              max={15}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
              <span>{t('onboarding.sliderMin')}</span>
              <span>{t('onboarding.sliderRecommended')}</span>
              <span>{t('onboarding.sliderMax')}</span>
            </div>
          </Field>

          <Field label={t('onboarding.languageLabel')}>
            <div className="inline-flex bg-slate-100 rounded-xl p-1">
              <TabButton active={language === 'ko'} onClick={() => setLanguage('ko')}>
                {t('onboarding.languageKo')}
              </TabButton>
              <TabButton active={language === 'en'} onClick={() => setLanguage('en')}>
                {t('onboarding.languageEn')}
              </TabButton>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{t('onboarding.languageHint')}</p>
          </Field>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-rose-900 text-sm">{t('onboarding.errorTitle')}</p>
                  <p className="text-sm text-rose-700 mt-0.5">{error}</p>
                  <p className="text-xs text-rose-600 mt-2">{t('onboarding.errorRetry')}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!ready}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-700 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-sky-300/60 hover:-translate-y-0.5 disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 transition-all"
          >
            {t('onboarding.submit')}
          </button>
        </form>
      </main>
    </div>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-2">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}
