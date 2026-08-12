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
  fetchVideoBlob,
  getResult,
  type AnalysisRead,
  type FeedbackJson,
  type ResultResponse,
  type SessionRead,
} from '../api'
import { useAuth } from '../auth/AuthContext'
import { useI18n } from '../i18n'

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
  const { user } = useAuth()
  const { t } = useI18n()
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
  if (!data) return <Centered>{t('result.loading')}</Centered>

  const feedback: FeedbackJson | null = parseFeedback(data.feedback?.llm_response_json)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="px-6 py-5 max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="SpeechCoach AI" className="h-64 w-auto -ml-6" />
        </Link>
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition">
          {t('result.backHome')}
        </Link>
      </nav>

      <ResultHero session={data.session} scores={feedback?.scores ?? null} />

      <main className="max-w-6xl mx-auto px-6 pb-16 space-y-6">
        {feedback ? (
          <>
            <Section title={t('result.sectionSummary')} badge="①">
              <p className="text-slate-800 leading-loose whitespace-pre-wrap">
                {feedback.overall_summary}
              </p>
            </Section>

            <Section title={t('result.sectionCriticalIssues')} badge="②">
              <div className="space-y-3">
                {feedback.critical_issues.map((issue, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-block text-[10px] font-bold tracking-wider px-2 py-1 rounded-md border ${
                          PRIORITY_BADGE[issue.priority] ?? PRIORITY_BADGE.low
                        }`}
                      >
                        {(issue.priority ?? 'low').toUpperCase()}
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

        <Section title={t('result.sectionNonverbal')} badge="④">
          <NonverbalCharts analyses={data.analyses} />
        </Section>

        <Section title={t('result.sectionVerbal')} badge="⑤">
          <VerbalCharts analyses={data.analyses} />
        </Section>

        {feedback && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              <Section title={t('result.sectionNonverbalFeedback')}>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {feedback.nonverbal_feedback}
                </p>
              </Section>
              <Section title={t('result.sectionVerbalFeedback')}>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {feedback.verbal_feedback}
                </p>
              </Section>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <ListSection title={t('result.sectionPracticeTips')} badge="⑥" items={feedback.practice_tips} accent="violet" />
              <ListSection
                title={t('result.sectionPositivePoints')}
                badge="⑦"
                items={feedback.positive_points}
                accent="emerald"
              />
            </div>
          </>
        )}

        <Section title={t('result.sectionQuestionDetails')} badge="③">
          <QuestionDetails
            session={data.session}
            analyses={data.analyses}
            sessionId={sessionId!}
          />
        </Section>

        <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-3xl p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900 mb-1">
              {t('result.savedTitle', {
                name: user?.display_name ?? user?.email ?? t('result.myAccount'),
              })}
            </h2>
            <p className="text-sm text-slate-600">
              {t('result.savedBody')}
            </p>
          </div>
          <Link
            to="/history"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            {t('result.viewHistory')}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
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
  const { t } = useI18n()
  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-sky-400/40 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-14">
        <span className="inline-block text-xs font-semibold tracking-widest bg-white/15 backdrop-blur px-3 py-1 rounded-full mb-3">
          {t('result.heroBadge')}
        </span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">
          {t('result.heroTitle', { jobTitle: session.job_title })}
        </h1>
        <p className="text-sky-100/90 text-lg">
          {t('result.heroSubtitle', {
            count: session.questions.length,
            minutes: session.questions.length * 1,
          })}
        </p>

        {scores ? (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreCard label={t('result.scoreOverall')} value={scores.overall} primary />
            <ScoreCard label={t('result.scoreContent')} value={scores.content} />
            <ScoreCard label={t('result.scoreNonverbal')} value={scores.nonverbal} />
            <ScoreCard label={t('result.scoreVerbal')} value={scores.verbal} />
          </div>
        ) : (
          <div className="mt-8 inline-flex items-center gap-2 bg-amber-400/20 border border-amber-200/30 text-amber-100 text-sm px-4 py-2 rounded-xl">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {t('result.scoresFailedBanner')}
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
  value: number | null
  primary?: boolean
}) {
  const { t } = useI18n()
  const isNA = value === null || value === undefined
  return (
    <div
      className={`rounded-2xl p-5 backdrop-blur ${
        primary
          ? 'bg-white text-slate-900 shadow-2xl shadow-blue-900/20'
          : 'bg-white/10 text-white border border-white/15'
      } ${isNA ? 'opacity-60' : ''}`}
    >
      <div className={`text-xs font-medium mb-1 ${primary ? 'text-slate-500' : 'text-sky-100/80'}`}>
        {label}
      </div>
      <div className="flex items-end gap-1">
        {isNA ? (
          <>
            <span className="text-4xl font-bold tabular-nums tracking-tighter">—</span>
            <span className={`mb-1.5 text-xs ${primary ? 'text-slate-400' : 'text-sky-200/70'}`}>
              {t('result.scoreNA')}
            </span>
          </>
        ) : (
          <>
            <span className="text-4xl font-bold tabular-nums tracking-tighter">{value}</span>
            <span className={`mb-1.5 text-sm ${primary ? 'text-slate-400' : 'text-sky-200/70'}`}>
              /100
            </span>
          </>
        )}
      </div>
      <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${primary ? 'bg-slate-100' : 'bg-white/10'}`}>
        <div
          className={`h-full rounded-full ${
            primary ? 'bg-gradient-to-r from-sky-400 to-blue-600' : 'bg-white/70'
          }`}
          style={{ width: `${isNA ? 0 : value}%` }}
        />
      </div>
    </div>
  )
}

function FallbackBanner() {
  const { t } = useI18n()
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
      <h2 className="font-bold text-amber-900 mb-1">{t('result.fallbackTitle')}</h2>
      <p className="text-amber-800 text-sm">
        {t('result.fallbackBody')}
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
  const { t } = useI18n()
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
        {t('result.noNonverbalData')}
      </p>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <ChartCard title={t('result.chartGaze')}>
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
      <ChartCard title={t('result.chartPosture')}>
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
      <ChartCard title={t('result.chartTremor')}>
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
  const { t } = useI18n()
  const spmData = analyses.map((a, i) => {
    let v = 0
    if (a.verbal_metrics_json) {
      try {
        const m = JSON.parse(a.verbal_metrics_json)
        // 신규: spm (음절/분). 레거시: wpm (단어/분) — 의미 차이 있으나 차트 호환.
        v = m.spm ?? m.wpm ?? 0
      } catch {
        /* skip */
      }
    }
    return { q: `Q${i + 1}`, spm: Math.round(v) }
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

  // null(측정 실패)을 0으로 강등한 차트값으로 "데이터 없음"을 판정하면 실제 측정값 0과
  // 구분하지 못한다. 실제 verbal 지표가 하나라도 있었는지로 판정한다.
  const hasVerbalData = analyses.some((a) => {
    if (!a.verbal_metrics_json) return false
    try {
      const m = JSON.parse(a.verbal_metrics_json)
      return (m.spm ?? m.wpm) != null || m.pitch_mean != null
    } catch {
      return false
    }
  })

  if (!hasVerbalData) {
    return (
      <p className="text-sm text-slate-500">
        {t('result.noVerbalData')}
      </p>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-5">
      <ChartCard title={t('result.chartSpm')}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={spmData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="q" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="spm" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <ChartCard title={t('result.chartPitch')}>
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
      <ChartCard title={t('result.chartFillers')}>
        {fillerData.length === 0 ? (
          <p className="text-sm text-slate-500 pt-12 text-center">{t('result.noFillers')}</p>
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

// 방향코드 → 사전 키 (렌더 시점에 t()로 조회)
const GAZE_DIR_KEY: Record<string, string> = {
  down: 'result.gazeDown',
  up: 'result.gazeUp',
  left: 'result.gazeLeft',
  right: 'result.gazeRight',
}

function fmtTimestamp(t: number): string {
  const m = Math.floor(t / 60)
  const s = Math.round(t % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

// 영상에서 몇 분 몇 초에 어떤 감점 요인이 있었는지 시간순으로 표기 (FR-17).
function DeductionTimeline({ a }: { a?: AnalysisRead }) {
  const { t } = useI18n()
  if (!a) return null
  const items: { t: number; text: string }[] = []
  try {
    if (a.verbal_metrics_json) {
      const v = JSON.parse(a.verbal_metrics_json)
      for (const e of (v.filler_events ?? []) as { t: number; label: string }[])
        items.push({ t: e.t, text: t('result.eventFiller', { label: e.label }) })
      for (const e of (v.silence_events ?? []) as { t: number; dur: number }[])
        items.push({ t: e.t, text: t('result.eventSilence', { dur: e.dur }) })
    }
    if (a.nonverbal_metrics_json) {
      const n = JSON.parse(a.nonverbal_metrics_json)
      for (const e of (n.gaze_off_events ?? []) as { t: number; dur: number; dir: string }[])
        items.push({
          t: e.t,
          text: t('result.eventGazeOff', {
            label: t(GAZE_DIR_KEY[e.dir] ?? 'result.gazeOff'),
            dur: e.dur,
          }),
        })
    }
  } catch {
    return null
  }
  if (items.length === 0) return null
  items.sort((x, y) => x.t - y.t)
  return (
    <div className="mt-4 bg-amber-50/60 border border-amber-100 rounded-xl p-4">
      <div className="text-xs font-bold text-amber-700 mb-2.5 flex items-center gap-1.5">
        <span>⏱️</span> {t('result.timelineTitle')}
      </div>
      <ul className="space-y-1.5">
        {items.map((d, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-slate-700">
            <span className="font-mono text-xs font-semibold text-amber-700 tabular-nums bg-amber-100 px-1.5 py-0.5 rounded">
              {fmtTimestamp(d.t)}
            </span>
            <span>{d.text}</span>
          </li>
        ))}
      </ul>
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
  const { t } = useI18n()
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
                  {t('result.analysisFailed')}
                </span>
              )}
            </div>
            <p className="font-semibold text-slate-900 mb-4 leading-relaxed">{q.text}</p>
            <AuthVideo sessionId={sessionId} qIndex={i} />
            <DeductionTimeline a={a} />
            {a?.asr_transcript && (
              <details className="mt-4 text-sm bg-white border border-slate-100 rounded-xl">
                <summary className="cursor-pointer px-4 py-3 font-medium text-slate-700 hover:text-slate-900 transition">
                  {t('result.viewTranscript')}
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

// LLM 원응답을 그대로 저장하므로 깨진 JSON일 수 있다. 파싱 실패 시 null →
// FallbackBanner로 폴백(페이지 전체 크래시 방지).
function parseFeedback(raw: string | null | undefined): FeedbackJson | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as FeedbackJson
  } catch {
    return null
  }
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="text-slate-600">{children}</div>
    </div>
  )
}

function AuthVideo({ sessionId, qIndex }: { sessionId: string; qIndex: number }) {
  const { t } = useI18n()
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let revokeUrl: string | null = null
    let cancelled = false
    fetchVideoBlob(sessionId, qIndex)
      .then((blob) => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        revokeUrl = url
        setSrc(url)
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message)
      })
    return () => {
      cancelled = true
      if (revokeUrl) URL.revokeObjectURL(revokeUrl)
    }
  }, [sessionId, qIndex])

  if (error) {
    return (
      <div className="w-full rounded-xl bg-slate-100 aspect-video flex items-center justify-center text-sm text-slate-500">
        {t('result.videoError', { error })}
      </div>
    )
  }
  if (!src) {
    return (
      <div className="w-full rounded-xl bg-slate-100 aspect-video flex items-center justify-center text-sm text-slate-400">
        {t('result.videoLoading')}
      </div>
    )
  }
  return <video controls className="w-full rounded-xl bg-black aspect-video" src={src} preload="metadata" />
}
