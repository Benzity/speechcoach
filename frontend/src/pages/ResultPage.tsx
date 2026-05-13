import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getResult,
  getVideoUrl,
  type AnalysisRead,
  type FeedbackJson,
  type ResultResponse,
  type SessionRead,
} from '../api'

const GAZE_COLORS: Record<string, string> = {
  camera: '#10b981',
  down: '#94a3b8',
  up: '#cbd5e1',
  left: '#fbbf24',
  right: '#f97316',
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-slate-50 text-slate-700 border-slate-200',
}

export default function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [data, setData] = useState<ResultResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    getResult(sessionId)
      .then(setData)
      .catch((e: Error) => setError(e.message))
  }, [sessionId])

  if (error) {
    return (
      <Centered>
        <p className="text-rose-600 font-medium">{error}</p>
      </Centered>
    )
  }
  if (!data) return <Centered>불러오는 중…</Centered>

  const feedback: FeedbackJson | null = data.feedback
    ? (JSON.parse(data.feedback.llm_response_json) as FeedbackJson)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="px-6 py-5 max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="SpeechCoach AI" className="h-64 w-auto -ml-6" />
        </Link>
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition">
          ← 처음으로
        </Link>
      </nav>

      <ResultHero session={data.session} scores={feedback?.scores ?? null} />

      <main className="max-w-6xl mx-auto px-6 pb-16 space-y-6">
        {feedback ? (
          <>
            <Section title="종합 요약" badge="①">
              <p className="text-slate-800 leading-loose whitespace-pre-wrap">
                {feedback.overall_summary}
              </p>
            </Section>

            <Section title="핵심 개선사항" badge="②">
              <div className="space-y-3">
                {feedback.critical_issues.map((issue, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-block text-[10px] font-bold tracking-wider px-2 py-1 rounded-md border ${
                          PRIORITY_BADGE[issue.priority] ?? PRIORITY_BADGE.low
                        }`}
                      >
                        {issue.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">{issue.title}</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        ) : (
          <FallbackBanner />
        )}

        <Section title="비언어 지표" badge="④">
          <NonverbalCharts analyses={data.analyses} />
        </Section>

        <Section title="반언어 지표" badge="⑤">
          <VerbalCharts analyses={data.analyses} />
        </Section>

        {feedback && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <Section title="비언어 종합 피드백">
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {feedback.nonverbal_feedback}
                </p>
              </Section>
              <Section title="반언어 종합 피드백">
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {feedback.verbal_feedback}
                </p>
              </Section>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <ListSection title="실천 팁" badge="⑥" items={feedback.practice_tips} accent="violet" />
              <ListSection
                title="잘하는 점"
                badge="⑦"
                items={feedback.positive_points}
                accent="emerald"
              />
            </div>
          </>
        )}

        <Section title="질문별 답변" badge="③">
          <QuestionDetails
            session={data.session}
            analyses={data.analyses}
            sessionId={sessionId!}
          />
        </Section>
      </main>
    </div>
  )
}

function ResultHero({
  session,
  scores,
}: {
  session: SessionRead
  scores: FeedbackJson['scores'] | null
}) {
  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-sky-400/40 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-14">
        <span className="inline-block text-xs font-semibold tracking-widest bg-white/15 backdrop-blur px-3 py-1 rounded-full mb-3">
          면접 결과
        </span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
          {session.job_title} 면접
        </h1>
        <p className="text-sky-100/90 text-lg">
          질문 {session.questions.length}개 · 총 {session.questions.length * 1}분 내외 면접 분석 결과
        </p>

        {scores ? (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreCard label="종합" value={scores.overall} primary />
            <ScoreCard label="내용 적합성" value={scores.content} />
            <ScoreCard label="비언어 표현" value={scores.nonverbal} />
            <ScoreCard label="반언어 표현" value={scores.verbal} />
          </div>
        ) : (
          <div className="mt-8 inline-flex items-center gap-2 bg-amber-400/20 border border-amber-200/30 text-amber-100 text-sm px-4 py-2 rounded-xl">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            종합 피드백 생성 실패 — 차트와 질문별 답변은 그대로 확인하실 수 있습니다.
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreCard({
  label,
  value,
  primary = false,
}: {
  label: string
  value: number
  primary?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-5 backdrop-blur ${
        primary
          ? 'bg-white text-slate-900 shadow-2xl shadow-blue-900/20'
          : 'bg-white/10 text-white border border-white/15'
      }`}
    >
      <div className={`text-xs font-medium mb-1 ${primary ? 'text-slate-500' : 'text-sky-100/80'}`}>
        {label}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-4xl font-bold tabular-nums tracking-tighter">{value}</span>
        <span className={`mb-1.5 text-sm ${primary ? 'text-slate-400' : 'text-sky-200/70'}`}>
          /100
        </span>
      </div>
      <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${primary ? 'bg-slate-100' : 'bg-white/10'}`}>
        <div
          className={`h-full rounded-full ${
            primary ? 'bg-gradient-to-r from-sky-400 to-blue-600' : 'bg-white/70'
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function FallbackBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
      <h2 className="font-bold text-amber-900 mb-1">종합 피드백을 가져오지 못했습니다</h2>
      <p className="text-amber-800 text-sm">
        Claude API 호출이 실패해 LLM 피드백 섹션은 표시되지 않습니다.
        아래의 차트와 질문별 답변은 그대로 확인하실 수 있습니다.
      </p>
    </div>
  )
}

function Section({
  title,
  badge,
  children,
}: {
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-7">
      <div className="flex items-center gap-3 mb-5">
        {badge && (
          <span className="text-sm font-bold text-blue-600">{badge}</span>
        )}
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ListSection({
  title,
  badge,
  items,
  accent,
}: {
  title: string
  badge?: string
  items: string[]
  accent: 'violet' | 'emerald'
}) {
  const dotClass = accent === 'violet' ? 'bg-sky-500' : 'bg-emerald-500'
  return (
    <Section title={title} badge={badge}>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-slate-800">
            <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2.5 ${dotClass}`} />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50/60 rounded-2xl p-5 border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function NonverbalCharts({ analyses }: { analyses: AnalysisRead[] }) {
  const gazeAggr: Record<string, number> = {}
  let gazeCount = 0
  for (const a of analyses) {
    if (!a.nonverbal_metrics_json) continue
    try {
      const m = JSON.parse(a.nonverbal_metrics_json)
      const g = m.gaze_distribution as Record<string, number> | undefined
      if (!g) continue
      gazeCount++
      for (const [k, v] of Object.entries(g)) gazeAggr[k] = (gazeAggr[k] ?? 0) + v
    } catch {
      /* skip */
    }
  }
  const gazeData =
    gazeCount > 0
      ? Object.entries(gazeAggr).map(([name, value]) => ({
          name,
          value: +(value / gazeCount).toFixed(3),
        }))
      : []

  const tremorData = analyses.map((a, i) => {
    let v = 0
    if (a.nonverbal_metrics_json) {
      try {
        const m = JSON.parse(a.nonverbal_metrics_json)
        v = m.hand_tremor_index ?? 0
      } catch {
        /* skip */
      }
    }
    return { q: `Q${i + 1}`, value: +v.toFixed(2) }
  })

  const postureData = analyses.map((a, i) => {
    let v = 0
    if (a.nonverbal_metrics_json) {
      try {
        const m = JSON.parse(a.nonverbal_metrics_json)
        v = m.posture?.spine_alignment ?? 0
      } catch {
        /* skip */
      }
    }
    return { q: `Q${i + 1}`, score: +(v * 100).toFixed(0) }
  })

  if (gazeData.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        비언어 분석 데이터가 없습니다. (분석 실패 또는 미실행)
      </p>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <ChartCard title="시선 분포 (평균)">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={gazeData} dataKey="value" nameKey="name" outerRadius={70} label>
              {gazeData.map((d) => (
                <Cell key={d.name} fill={GAZE_COLORS[d.name] ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="자세 정렬 점수 (0~100)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={postureData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="q" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="score" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="손 떨림 지수 (0~10)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={tremorData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="q" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ fill: '#ef4444', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function VerbalCharts({ analyses }: { analyses: AnalysisRead[] }) {
  const wpmData = analyses.map((a, i) => {
    let v = 0
    if (a.verbal_metrics_json) {
      try {
        const m = JSON.parse(a.verbal_metrics_json)
        v = m.wpm ?? 0
      } catch {
        /* skip */
      }
    }
    return { q: `Q${i + 1}`, wpm: Math.round(v) }
  })

  const pitchData = analyses.map((a, i) => {
    let mean = 0
    if (a.verbal_metrics_json) {
      try {
        const m = JSON.parse(a.verbal_metrics_json)
        mean = m.pitch_mean ?? 0
      } catch {
        /* skip */
      }
    }
    return { q: `Q${i + 1}`, pitch: Math.round(mean) }
  })

  const fillerAggr: Record<string, number> = {}
  for (const a of analyses) {
    if (!a.verbal_metrics_json) continue
    try {
      const m = JSON.parse(a.verbal_metrics_json)
      const fillers = (m.fillers ?? {}) as Record<string, number>
      for (const [k, v] of Object.entries(fillers)) {
        fillerAggr[k] = (fillerAggr[k] ?? 0) + v
      }
    } catch {
      /* skip */
    }
  }
  const fillerData = Object.entries(fillerAggr)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }))

  if (pitchData.every((p) => p.pitch === 0) && wpmData.every((w) => w.wpm === 0)) {
    return (
      <p className="text-sm text-slate-500">
        반언어 분석 데이터가 없습니다. (분석 실패 또는 미실행)
      </p>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <ChartCard title="질문별 발화 속도 (WPM)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={wpmData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="q" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="wpm" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="질문별 평균 피치 (Hz)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={pitchData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="q" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="pitch"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={{ fill: '#0284c7', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title="필러워드 빈도 (Top 10)">
        {fillerData.length === 0 ? (
          <p className="text-sm text-slate-500 pt-12 text-center">필러워드 없음 ✨</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fillerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="word" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}

function QuestionDetails({
  session,
  analyses,
  sessionId,
}: {
  session: SessionRead
  analyses: AnalysisRead[]
  sessionId: string
}) {
  return (
    <div className="space-y-4">
      {session.questions.map((q, i) => {
        const a = analyses.find((x) => x.question_id === q.id)
        return (
          <div
            key={q.id}
            className="border border-slate-100 rounded-2xl p-5 bg-slate-50/40 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold text-blue-600">Q{i + 1}</span>
              {q.category && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-sky-50 text-blue-700 border border-sky-100 font-medium">
                  {q.category}
                </span>
              )}
              {a?.status === 'failed' && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100 font-medium">
                  분석 실패
                </span>
              )}
            </div>
            <p className="font-semibold text-slate-900 mb-4 leading-relaxed">{q.text}</p>
            <video
              controls
              className="w-full rounded-xl bg-black aspect-video"
              src={getVideoUrl(sessionId, i)}
              preload="metadata"
            />
            {a?.asr_transcript && (
              <details className="mt-4 text-sm bg-white border border-slate-100 rounded-xl">
                <summary className="cursor-pointer px-4 py-3 font-medium text-slate-700 hover:text-slate-900 transition">
                  답변 전사 보기
                </summary>
                <p className="px-4 pb-4 text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-slate-100 pt-3">
                  {a.asr_transcript}
                </p>
              </details>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="text-slate-600">{children}</div>
    </div>
  )
}
