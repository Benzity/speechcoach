import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getSession, uploadAnswer, type SessionRead } from '../api'

type UploadState = {
  qIndex: number
  status: 'uploading' | 'done' | 'failed'
  attempt: number
}

type PermissionState = 'pending' | 'granted' | 'denied'

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionRead | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [permission, setPermission] = useState<PermissionState>('pending')
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [uploads, setUploads] = useState<UploadState[]>([])

  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!sessionId) return
    getSession(sessionId)
      .then(setSession)
      .catch((e: Error) => setLoadError(e.message))
  }, [sessionId])

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setPermission('granted')
      })
      .catch((err: Error) => {
        // NotAllowedError(권한 거부)는 사용자가 의식적으로 차단한 것 → 에러 화면
        if (err.name === 'NotAllowedError') {
          setPermission('denied')
          setPermissionError(
            '카메라·마이크 권한이 거부되었습니다. 브라우저 주소창의 권한 아이콘에서 허용한 뒤 새로고침해주세요.',
          )
          return
        }
        // 기기 부재(NotFoundError) 등은 데모 모드로 진행 (시연·디자인 미리보기용)
        console.warn('미디어 기기 접근 실패 — 데모 모드로 진행:', err.message)
        setDemoMode(true)
        setPermission('granted')
      })
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const beginCountdown = () => {
    if (isRecording || countdown !== null) return
    setCountdown(3)
  }

  const actuallyStartRecording = () => {
    if (demoMode || !streamRef.current) {
      setIsRecording(true)
      return
    }
    chunksRef.current = []
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm'
    const recorder = new MediaRecorder(streamRef.current, { mimeType })
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.start()
    recorderRef.current = recorder
    setIsRecording(true)
  }

  useEffect(() => {
    if (countdown === null) return
    if (countdown < 0) {
      setCountdown(null)
      actuallyStartRecording()
      return
    }
    // 0("시작!")은 짧게, 3/2/1은 1초씩
    const delay = countdown === 0 ? 450 : 1000
    const id = window.setTimeout(
      () => setCountdown((c) => (c === null ? null : c - 1)),
      delay,
    )
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown])

  const stopRecording = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (demoMode || !recorderRef.current) {
        // 데모 모드: 1KB 더미 blob (백엔드는 영상으로 저장 → 큐 등록 → 분석은 실패)
        resolve(new Blob([new Uint8Array(1024)], { type: 'video/webm' }))
        return
      }
      const recorder = recorderRef.current
      if (recorder.state !== 'recording') {
        resolve(null)
        return
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        chunksRef.current = []
        resolve(blob)
      }
      recorder.stop()
    })
  }

  const uploadWithRetry = async (qIndex: number, blob: Blob, attempt: number): Promise<void> => {
    if (!sessionId) return
    try {
      await uploadAnswer(sessionId, qIndex, blob)
      setUploads((prev) =>
        prev.map((u) => (u.qIndex === qIndex ? { ...u, status: 'done' } : u)),
      )
    } catch (err) {
      console.error(`업로드 실패 q=${qIndex} attempt=${attempt}`, err)
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1000 * attempt))
        setUploads((prev) =>
          prev.map((u) => (u.qIndex === qIndex ? { ...u, attempt: attempt + 1 } : u)),
        )
        return uploadWithRetry(qIndex, blob, attempt + 1)
      }
      setUploads((prev) =>
        prev.map((u) => (u.qIndex === qIndex ? { ...u, status: 'failed' } : u)),
      )
    }
  }

  const scheduleUpload = (qIndex: number, blob: Blob) => {
    setUploads((prev) => [...prev, { qIndex, status: 'uploading', attempt: 1 }])
    void uploadWithRetry(qIndex, blob, 1)
  }

  const handleNext = async () => {
    if (!session || !isRecording) return
    const justFinished = currentIndex
    const blob = await stopRecording()
    setIsRecording(false)
    if (blob && blob.size > 0) {
      scheduleUpload(justFinished, blob)
    }
    if (justFinished + 1 >= session.questions.length) {
      navigate(`/processing/${sessionId}`)
    } else {
      setCurrentIndex(justFinished + 1)
    }
  }

  if (loadError) return <ScreenMessage message={loadError} variant="error" />
  if (!session) return <ScreenMessage message="세션을 불러오는 중…" />
  if (permission === 'pending')
    return <ScreenMessage message="카메라·마이크 권한 요청 중…" />
  if (permission === 'denied')
    return <ScreenMessage message={permissionError ?? '권한이 거부되었습니다.'} variant="error" />

  const currentQuestion = session.questions[currentIndex]
  const total = session.questions.length
  const doneCount = uploads.filter((u) => u.status === 'done').length
  const uploadingCount = uploads.filter((u) => u.status === 'uploading').length
  const failedCount = uploads.filter((u) => u.status === 'failed').length
  const progressPct = ((currentIndex + (isRecording ? 0.5 : 0)) / total) * 100
  const isLast = currentIndex + 1 >= total

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md">
          <div className="text-center">
            <p className="text-sky-300/80 text-sm font-medium tracking-widest mb-6">
              잠시 후 녹화가 시작됩니다
            </p>
            <div
              key={countdown}
              className="animate-countdown text-[14rem] leading-none font-extrabold tracking-tighter bg-gradient-to-br from-white via-sky-200 to-sky-300 bg-clip-text text-transparent"
            >
              {countdown === 0 ? '시작!' : countdown}
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="flex items-center hover:opacity-80 transition">
              <img src="/logo.png" alt="SpeechCoach AI" className="h-44 w-auto -ml-4" />
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-400">{session.job_title} 면접</span>
              <span className="text-slate-600">·</span>
              <span className="text-white font-semibold tabular-nums">
                {currentIndex + 1}
                <span className="text-slate-500"> / {total}</span>
              </span>
            </div>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </header>

      {uploads.length > 0 && (
        <div className="fixed top-20 right-6 z-10 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 text-xs shadow-2xl">
          <div className="font-semibold text-slate-300 mb-1">업로드 상태</div>
          <div className="flex items-center gap-3 tabular-nums">
            <span className="text-emerald-400">
              완료 {doneCount}/{uploads.length}
            </span>
            {uploadingCount > 0 && (
              <span className="text-amber-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                진행 {uploadingCount}
              </span>
            )}
            {failedCount > 0 && <span className="text-rose-400">실패 {failedCount}</span>}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-5 gap-6 items-stretch">
          <div className="md:col-span-3">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden ring-1 ring-slate-800/80">
              {demoMode ? (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-slate-400">
                  <svg
                    className="w-14 h-14 mb-3 opacity-50"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z" />
                  </svg>
                  <p className="text-sm font-medium">카메라가 연결되지 않았습니다</p>
                  <p className="text-xs text-slate-500 mt-1">데모 모드로 흐름을 진행합니다</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-semibold text-rose-200">REC</span>
                </div>
              )}
              {demoMode && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-500/15 border border-amber-400/30 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-semibold tracking-wider text-amber-200">DEMO</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300/80">
                <span>{demoMode ? '데모 프리뷰' : '실시간 프리뷰'}</span>
                <span className="tabular-nums">{Math.round(progressPct)}%</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col">
            <div className="bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-sky-400 tracking-wider">
                  Q{currentIndex + 1}
                </span>
                {currentQuestion?.category && (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20 font-medium">
                    {currentQuestion.category}
                  </span>
                )}
              </div>
              <p className="text-xl leading-relaxed font-medium tracking-tight flex-1">
                {currentQuestion?.text}
              </p>
              {currentQuestion?.intent && (
                <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-800/60">
                  의도: {currentQuestion.intent}
                </p>
              )}
            </div>

            <div className="mt-4">
              {!isRecording ? (
                <button
                  onClick={beginCountdown}
                  disabled={countdown !== null}
                  className="w-full group bg-gradient-to-r from-rose-500 to-red-600 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all flex items-center justify-center gap-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white group-hover:scale-110 transition" />
                  {countdown !== null ? '준비 중…' : '답변 시작'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-700 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  {isLast ? '면접 종료' : '다음 질문'}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            <span className="text-slate-400">팁:</span> 카메라를 정면으로 바라보고, 손짓은 자연스럽게.
            답변이 끝나면 <span className="text-sky-400 font-medium">다음 질문</span> 버튼을 누르세요.
          </p>
        </div>
      </main>
    </div>
  )
}

function ScreenMessage({
  message,
  variant = 'info',
}: {
  message: string
  variant?: 'info' | 'error'
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <div className="max-w-md text-center px-6">
        <p className={variant === 'error' ? 'text-rose-600 font-medium' : 'text-slate-600'}>
          {message}
        </p>
        {variant === 'error' && (
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-700 transition"
          >
            새로고침
          </button>
        )}
      </div>
    </div>
  )
}
