import { Link } from 'react-router-dom'

export default function StartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <nav className="px-6 py-2 max-w-7xl mx-auto flex items-center justify-between">
        <img src="/logo.png" alt="SpeechCoach AI" className="h-64 w-auto -ml-6" />
        <span className="text-xs text-sky-500/80 font-medium">v2.0 · Demo</span>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-2 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-sky-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              AI 모의면접 · 비언어/반언어 분석
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.15] tracking-tight">
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 bg-clip-text text-transparent">
                직무 맞춤 질문
              </span>
              으로
              <br />
              완벽한 면접을 준비하세요
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed">
              <span className="font-semibold text-blue-700">AI 면접관</span>이
              이력서 기반 맞춤 질문을 만들고,
              <br />
              답변 영상을 분석해{' '}
              <span className="font-semibold text-sky-700">
                시선·자세·어조
              </span>
              까지 종합 피드백해드립니다.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-start gap-3">
              <Link
                to="/onboarding"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg shadow-sky-300/40 hover:shadow-xl hover:shadow-sky-300/60 hover:-translate-y-0.5 transition-all"
              >
                면접 시작하기
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
                약 <span className="font-bold text-blue-700">3분</span>이면 첫 질문 시작
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
              <Check>
                면접 기록 <span className="font-semibold text-blue-700">누적 관리</span>
              </Check>
              <Check>
                한국어 <span className="font-bold text-blue-700">100%</span>
              </Check>
              <Check>
                <span className="font-bold text-blue-700">Claude AI</span> 코칭
              </Check>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-br from-sky-300 via-sky-200 to-sky-300 rounded-[3rem] blur-3xl opacity-40" />
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-sky-200/40 p-7 border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-400">종합 점수</span>
                <span className="text-xs text-blue-600 font-medium">결과 미리보기</span>
              </div>
              <div className="flex items-end gap-2 mb-7">
                <span className="text-6xl font-bold bg-gradient-to-br from-sky-500 via-blue-600 to-blue-800 bg-clip-text text-transparent tracking-tighter">
                  85
                </span>
                <span className="text-slate-400 mb-3 text-lg">/100</span>
              </div>
              <div className="space-y-4">
                <ScoreRow label="내용 적합성" value={88} from="from-sky-400" to="to-blue-600" />
                <ScoreRow label="비언어 표현" value={75} from="from-sky-500" to="to-cyan-500" />
                <ScoreRow label="반언어 표현" value={82} from="from-emerald-500" to="to-teal-500" />
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="text-xs text-slate-400 mb-2.5 font-medium">핵심 개선사항</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-100">
                    HIGH
                  </span>
                  <span className="text-slate-700 font-medium">필러워드 사용을 줄여보세요</span>
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
            title="직무 맞춤 질문"
            desc={
              <>
                이력서·직무를 분석해{' '}
                <strong className="font-semibold text-blue-700">Claude AI</strong>
                가 N개의 면접 질문을 사전 생성합니다.
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
            title="비언어 분석"
            desc={
              <>
                <strong className="font-semibold text-blue-700">MediaPipe</strong>
                로{' '}
                <strong className="font-semibold text-sky-700">
                  시선·자세·표정·손 움직임
                </strong>
                을 영상에서 자동 분석합니다.
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
            title="반언어 분석"
            desc={
              <>
                음성 인식 +{' '}
                <strong className="font-semibold text-sky-700">
                  피치·속도·필러워드·침묵
                </strong>
                까지 정밀 측정해 코칭합니다.
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

