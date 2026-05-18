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
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [displayed, setDisplayed] = useState('')

  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const ELEVEN_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined
  const ELEVEN_VOICE = '21m00Tcm4TlvDq8ikWAM' // Rachel — 무료 플랜 기본 여성 목소리

  async function speakWithElevenLabs(text: string) {
    if (!ELEVEN_KEY) return false
    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`, {
        method: 'POST',
        headers: { 'xi-api-key': ELEVEN_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      })
      if (!res.ok) return false
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      audioRef.current?.pause()
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onplay = () => setIsSpeaking(true)
      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url) }
      audio.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url) }
      await audio.play()
      return true
    } catch {
      return false
    }
  }

  function speakWithBrowser(text: string) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ko-KR'
    utter.rate = 0.92
    utter.pitch = 1.0
    const voices = window.speechSynthesis.getVoices()
    const priority = ['Google 한국의', 'Yuna', 'Google Korean']
    const best =
      priority.reduce<SpeechSynthesisVoice | null>((found, name) => {
        return found ?? voices.find((v) => v.name.includes(name)) ?? null
      }, null) ?? voices.find((v) => v.lang.startsWith('ko')) ?? null
    if (best) utter.voice = best
    utter.onstart = () => setIsSpeaking(true)
    utter.onend = () => setIsSpeaking(false)
    utter.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utter)
  }

  async function speak(text: string) {
    const ok = await speakWithElevenLabs(text)
    if (!ok) speakWithBrowser(text)
  }

  function stopSpeaking() {
    audioRef.current?.pause()
    audioRef.current = null
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }

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
        if (err.name === 'NotAllowedError') {
          setPermission('denied')
          setPermissionError(
            '카메라·마이크 권한이 거부되었습니다. 브라우저 주소창의 권한 아이콘에서 허용한 뒤 새로고침해주세요.',
          )
          return
        }
        console.warn('미디어 기기 접근 실패 — 데모 모드로 진행:', err.message)
        setDemoMode(true)
        setPermission('granted')
      })
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // TTS + typewriter — 새 질문이 표시될 때마다 면접관이 말함
  useEffect(() => {
    if (!session) return
    const text = session.questions[currentIndex]?.text
    if (!text) return

    // typewriter
    setDisplayed('')
    let i = 0
    const tInterval = window.setInterval(() => {
      i += 1
      setDisplayed(text.slice(0, i))
      if (i >= text.length) window.clearInterval(tInterval)
    }, 35)

    // speech
    if (!isMuted) speak(text)

    return () => {
      window.clearInterval(tInterval)
      stopSpeaking()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, session])

  useEffect(() => {
    return () => { stopSpeaking() }
  }, [])

  const speakAgain = () => {
    if (!session) return
    const text = session.questions[currentIndex]?.text
    if (!text) return
    stopSpeaking()
    speak(text)
  }

  const toggleMute = () => {
    if (!isMuted) stopSpeaking()
    setIsMuted((m) => !m)
  }

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
        <div className="fixed top-32 right-6 z-10 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl px-4 py-2.5 text-xs shadow-2xl">
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-5 gap-5">
          {/* AI 면접관 stage */}
          <div className="md:col-span-3 relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 min-h-[480px]">
            {/* 배경 글로우 */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className={`absolute top-12 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] bg-sky-500/20 rounded-full blur-3xl transition-opacity duration-700 ${
                  isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-40'
                }`}
              />
              <div
                className={`absolute bottom-0 left-1/4 w-72 h-72 bg-blue-700/20 rounded-full blur-3xl transition-opacity duration-700 ${
                  isSpeaking ? 'opacity-80 animate-pulse' : 'opacity-30'
                }`}
              />
            </div>

            <div className="absolute top-5 left-5 flex items-center gap-2.5 z-10">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="text-[11px] font-bold tracking-[0.18em] text-sky-300">
                AI 면접관 · COACH
              </span>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                onClick={speakAgain}
                disabled={isMuted}
                className="bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 backdrop-blur rounded-full p-2 transition"
                title="질문 다시 듣기"
              >
                <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
              <button
                onClick={toggleMute}
                className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 backdrop-blur rounded-full p-2 transition"
                title={isMuted ? '음소거 해제' : '음소거'}
              >
                {isMuted ? (
                  <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>
            </div>

            <div className="relative flex flex-col items-center justify-center h-full px-8 py-14">
              {/* ORB (말할 때 펄스 + 글로우 강화) */}
              <div className="relative mb-8">
                <div
                  className={`absolute inset-0 rounded-full bg-sky-400/30 blur-2xl transition-all duration-500 ${
                    isSpeaking ? 'animate-ping scale-150' : 'scale-100'
                  }`}
                />
                <div
                  className={`absolute inset-0 rounded-full bg-blue-500/30 blur-xl transition-opacity duration-300 ${
                    isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-60'
                  }`}
                />
                <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 shadow-2xl shadow-blue-500/60 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/40 rounded-full" />
                  <div
                    className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white/30 blur-md transition-transform duration-300 ${
                      isSpeaking ? 'scale-110' : 'scale-100'
                    }`}
                  />
                  <div className="absolute inset-4 rounded-full border border-white/20" />
                  <div className="absolute inset-8 rounded-full border border-white/15" />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold text-sky-400 tracking-wider">
                  Q{currentIndex + 1}
                </span>
                {currentQuestion?.category && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20 font-medium">
                    {currentQuestion.category}
                  </span>
                )}
              </div>

              <p className="text-center text-lg md:text-xl font-medium leading-relaxed text-white max-w-xl min-h-[4rem]">
                "{displayed}"
                {displayed.length < (currentQuestion?.text?.length ?? 0) && (
                  <span className="inline-block w-1 h-5 bg-sky-400 ml-0.5 animate-pulse align-middle" />
                )}
              </p>

              {/* 음파 시각화 */}
              <div className="flex items-end justify-center gap-1.5 mt-6 h-8">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full bg-gradient-to-t from-sky-500 to-blue-300 ${
                      isSpeaking ? 'animate-wave' : 'opacity-30'
                    }`}
                    style={
                      isSpeaking
                        ? {
                            animationDelay: `${i * 0.07}s`,
                            animationDuration: `${0.55 + (i % 3) * 0.12}s`,
                            height: `${36 + (i % 4) * 10}%`,
                          }
                        : { height: '6px' }
                    }
                  />
                ))}
              </div>

              {currentQuestion?.intent && (
                <p className="text-xs text-slate-500 mt-6 text-center max-w-md italic">
                  {currentQuestion.intent}
                </p>
              )}
            </div>
          </div>

          {/* 카메라 PIP + 컨트롤 */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden ring-1 ring-slate-800/80 flex-shrink-0">
              {demoMode ? (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-slate-400">
                  <svg className="w-10 h-10 mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z" />
                  </svg>
                  <p className="text-xs">카메라 미연결</p>
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
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-rose-200">REC</span>
                </div>
              )}
              {demoMode && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500/15 border border-amber-400/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                  <span className="text-[9px] font-semibold tracking-wider text-amber-200">DEMO</span>
                </div>
              )}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-slate-300/80">
                <span>{demoMode ? '데모' : '나'}</span>
                <span className="tabular-nums">{Math.round(progressPct)}%</span>
              </div>
            </div>

            <div className="flex-1 bg-slate-900/60 backdrop-blur border border-slate-800/80 rounded-2xl p-5 flex flex-col">
              <p className="text-xs text-slate-400 leading-relaxed">
                {!isRecording
                  ? '면접관의 질문을 듣고 답변할 준비가 되면 시작하세요.'
                  : '답변이 끝나면 다음 버튼을 누르세요. 영상은 백그라운드로 업로드됩니다.'}
              </p>
              <div className="flex-1" />
              {!isRecording ? (
                <button
                  onClick={beginCountdown}
                  disabled={countdown !== null}
                  className="w-full group bg-gradient-to-r from-rose-500 to-red-600 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-rose-500/30 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white group-hover:scale-110 transition" />
                  {countdown !== null ? '준비 중…' : '답변 시작'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-sky-500 to-blue-700 text-white py-4 rounded-2xl font-semibold shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4"
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
