import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n'

type Status = 'idle' | 'requesting' | 'ready' | 'error'

export default function DeviceTest() {
  const { t } = useI18n()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [level, setLevel] = useState(0) // 0..1
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)

  function stop() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setLevel(0)
    setStatus('idle')
  }

  async function start() {
    setStatus('requesting')
    setError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = s
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.play().catch(() => {})
      }
      // 마이크 레벨 미터
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      audioCtxRef.current = ctx
      const src = ctx.createMediaStreamSource(s)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      src.connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        // RMS
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buf.length)
        setLevel(Math.min(1, rms * 4)) // 약간 증폭
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
      setStatus('ready')
    } catch (e) {
      const err = e as Error
      if (err.name === 'NotAllowedError') {
        setError(t('onboarding.devicePermissionDenied'))
      } else if (err.name === 'NotFoundError') {
        setError(t('onboarding.deviceNotFound'))
      } else {
        setError(`${err.name}: ${err.message}`)
      }
      setStatus('error')
    }
  }

  useEffect(() => {
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-slate-900">{t('onboarding.deviceTitle')}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('onboarding.deviceSubtitle')}
          </p>
        </div>
        {status === 'ready' ? (
          <button
            type="button"
            onClick={stop}
            className="text-xs font-semibold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-rose-300 transition"
          >
            {t('onboarding.deviceStop')}
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={status === 'requesting'}
            className="text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-700 px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {status === 'requesting' ? t('onboarding.deviceRequesting') : t('onboarding.deviceStart')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 카메라 미리보기 */}
        <div className="col-span-2 aspect-video bg-black rounded-xl overflow-hidden relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {status !== 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 bg-slate-900/80">
              {status === 'idle' && t('onboarding.deviceIdleOverlay')}
              {status === 'requesting' && t('onboarding.deviceRequesting')}
              {status === 'error' && t('onboarding.deviceNoCamera')}
            </div>
          )}
          {status === 'ready' && (
            <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-100">LIVE</span>
            </div>
          )}
        </div>

        {/* 마이크 레벨 */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col">
          <p className="text-xs font-medium text-slate-600 mb-2">{t('onboarding.deviceMicLabel')}</p>
          <div className="flex-1 flex items-end gap-1">
            {Array.from({ length: 12 }).map((_, i) => {
              const threshold = (i + 1) / 12
              const active = level >= threshold
              const color =
                i < 7 ? 'bg-emerald-400' : i < 10 ? 'bg-amber-400' : 'bg-rose-500'
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all ${
                    active ? color : 'bg-slate-100'
                  }`}
                  style={{ height: `${10 + i * 6}%` }}
                />
              )
            })}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            {status === 'ready'
              ? level > 0.05
                ? t('onboarding.deviceMicGood')
                : t('onboarding.deviceMicSpeak')
              : t('onboarding.deviceMicWaiting')}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  )
}
