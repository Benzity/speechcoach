import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createSession } from '../api'

type ResumeTab = 'text' | 'pdf'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [jobTitle, setJobTitle] = useState('')
  const [resumeTab, setResumeTab] = useState<ResumeTab>('text')
  const [resumeText, setResumeText] = useState('')
  const [resumePdf, setResumePdf] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        questionCount,
      })
      navigate(`/interview/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
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
        <p className="mt-7 text-slate-900 font-semibold">맞춤 면접 질문을 생성하고 있습니다</p>
        <p className="mt-1 text-sm text-slate-500">평균 10초 정도 걸립니다</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <nav className="px-6 py-5 max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="SpeechCoach AI" className="h-64 w-auto -ml-6" />
        </Link>
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition">
          ← 처음으로
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-8 pb-16">
        <div className="mb-8">
          <span className="text-xs font-semibold text-blue-600 tracking-wider">STEP 1 OF 1</span>
          <h1 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">
            면접 정보를 입력해주세요
          </h1>
          <p className="text-slate-500 mt-2">
            직무와 이력서를 알려주시면 맞춤 질문을 생성합니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 space-y-8">
          <Field label="관심 직무" required>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="예: 백엔드 개발자, 데이터 분석가, 마케팅 매니저…"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100 transition"
              required
            />
          </Field>

          <Field label="이력서" required>
            <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-3">
              <TabButton active={resumeTab === 'text'} onClick={() => setResumeTab('text')}>
                텍스트 입력
              </TabButton>
              <TabButton active={resumeTab === 'pdf'} onClick={() => setResumeTab('pdf')}>
                PDF 업로드
              </TabButton>
            </div>
            {resumeTab === 'text' ? (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={10}
                maxLength={5000}
                placeholder="이력서 내용을 자유 형식으로 붙여넣어주세요. (최대 5,000자)"
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
                    <p className="font-medium text-slate-700">PDF 파일을 선택하거나 끌어다 놓으세요</p>
                    <p className="text-xs text-slate-500 mt-1">최대 10MB</p>
                  </>
                )}
              </label>
            )}
          </Field>

          <Field label={`질문 개수: ${questionCount}개`}>
            <input
              type="range"
              min={3}
              max={15}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
              <span>3개 (5분)</span>
              <span>권장 5~7개</span>
              <span>15개 (20분)</span>
            </div>
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
                  <p className="font-semibold text-rose-900 text-sm">질문 생성 실패</p>
                  <p className="text-sm text-rose-700 mt-0.5">{error}</p>
                  <p className="text-xs text-rose-600 mt-2">잠시 후 다시 시도해주세요.</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!ready}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-700 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-sky-300/60 hover:-translate-y-0.5 disabled:bg-none disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 transition-all"
          >
            질문 생성 시작
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
