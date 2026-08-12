import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAnalysisStatus, triggerFeedback, type AnalysisStatus } from '../api'
import { useI18n } from '../i18n'

type Phase = 'analyzing' | 'feedback' | 'error'

// 분석 대기 시간 동안 10초마다 순환 노출되는 취업 팁 (NFR-03 대기 만족도 개선)
const WAITING_TIP_KEYS = [
  'processing.tip1',
  'processing.tip2',
  'processing.tip3',
  'processing.tip4',
  'processing.tip5',
  'processing.tip6',
  'processing.tip7',
]

export default function ProcessingPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [phase, setPhase] = useState<Phase>('analyzing')
  const [error, setError] = useState<string | null>(null)
  const [tipIndex, setTipIndex] = useState(0)
  const cancelRef = useRef(false)

  useEffect(() => {
    cancelRef.current = false
    if (!sessionId) return

    const tick = async () => {
      if (cancelRef.current) return
      try {
        const s = await getAnalysisStatus(sessionId)
        if (cancelRef.current) return
        setStatus(s)
        const remaining = s.queued + s.in_progress
        if (remaining === 0) {
          setPhase('feedback')
          try {
            await triggerFeedback(sessionId)
          } catch (e) {
            console.error('피드백 생성 실패 (fallback 진입):', e)
          }
          if (cancelRef.current) return
          navigate(`/result/${sessionId}`)
        } else {
          window.setTimeout(tick, 1500)
        }
      } catch (e) {
        if (cancelRef.current) return
        setPhase('error')
        setError(e instanceof Error ? e.message : t('processing.unknownError'))
      }
    }
    tick()
    return () => {
      cancelRef.current = true
    }
  }, [sessionId, navigate, t])

  // 대기 중 10초마다 취업 팁 순환
  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % WAITING_TIP_KEYS.length)
    }, 10000)
    return () => window.clearInterval(id)
  }, [])

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4">
        <p className="text-rose-600 font-medium mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-700 transition"
        >
          {t('processing.refresh')}
        </button>
      </div>
    )
  }

  const total = status?.total ?? 0
  const done = (status?.completed ?? 0) + (status?.failed ?? 0)
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex flex-col items-center justify-center px-6">
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-sky-300 rounded-full blur-3xl opacity-40 animate-pulse" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-sky-500 to-blue-700 shadow-2xl shadow-sky-300/50 flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        {phase === 'feedback' ? t('processing.feedbackTitle') : t('processing.analyzingTitle')}
      </h1>
      <p className="text-slate-500 mt-2">
        {phase === 'analyzing'
          ? t('processing.analyzingSubtitle')
          : t('processing.feedbackSubtitle')}
      </p>

      {status && phase === 'analyzing' && (
        <div className="mt-10 w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-7">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">{t('processing.progressLabel')}</span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {t('processing.progressCount', { done, total, progress })}
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <StatBlock label={t('processing.statCompleted')} value={status.completed} color="emerald" />
            <StatBlock label={t('processing.statInProgress')} value={status.in_progress} color="amber" />
            <StatBlock label={t('processing.statQueued')} value={status.queued} color="slate" />
            <StatBlock label={t('processing.statFailed')} value={status.failed} color="rose" />
          </div>
          {status.failed > 0 && (
            <p className="text-xs text-amber-700 mt-4 pt-4 border-t border-slate-100">
              {t('processing.partialFailure', { count: status.failed })}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 w-full max-w-md bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-2xl px-6 py-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">💡</span>
          <span className="text-xs font-bold tracking-wider text-blue-600">{t('processing.tipBadge')}</span>
        </div>
        <p key={tipIndex} className="text-sm text-slate-700 leading-relaxed">
          {t(WAITING_TIP_KEYS[tipIndex])}
        </p>
      </div>
    </div>
  )
}

function StatBlock({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: 'emerald' | 'amber' | 'slate' | 'rose'
}) {
  const bgMap = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-50 text-slate-700',
    rose: 'bg-rose-50 text-rose-700',
  }
  return (
    <div className={`rounded-xl px-3 py-2 ${bgMap[color]}`}>
      <div className="text-[10px] font-semibold tracking-wider opacity-80">{label.toUpperCase()}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
    </div>
  )
}
