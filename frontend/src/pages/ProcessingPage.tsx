import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAnalysisStatus, triggerFeedback, type AnalysisStatus } from '../api'

type Phase = 'analyzing' | 'feedback' | 'error'

export default function ProcessingPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [phase, setPhase] = useState<Phase>('analyzing')
  const [error, setError] = useState<string | null>(null)
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
        setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.')
      }
    }
    tick()
    return () => {
      cancelRef.current = true
    }
  }, [sessionId, navigate])

  if (phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4">
        <p className="text-rose-600 font-medium mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-700 transition"
        >
          새로고침
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
        {phase === 'feedback' ? '종합 피드백 생성 중…' : '답변 분석 중…'}
      </h1>
      <p className="text-slate-500 mt-2">
        {phase === 'analyzing'
          ? '시선·자세·어조·필러워드를 분석하고 있습니다.'
          : 'AI가 종합 피드백을 작성하고 있습니다. (5~15초)'}
      </p>

      {status && phase === 'analyzing' && (
        <div className="mt-10 w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-7">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">진행률</span>
            <span className="text-sm font-bold text-slate-900 tabular-nums">
              {done} / {total} ({progress}%)
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <StatBlock label="분석 완료" value={status.completed} color="emerald" />
            <StatBlock label="진행 중" value={status.in_progress} color="amber" />
            <StatBlock label="대기" value={status.queued} color="slate" />
            <StatBlock label="실패" value={status.failed} color="rose" />
          </div>
          {status.failed > 0 && (
            <p className="text-xs text-amber-700 mt-4 pt-4 border-t border-slate-100">
              일부 분석 실패 ({status.failed}건) — 가능한 데이터로 피드백을 생성합니다.
            </p>
          )}
        </div>
      )}
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
