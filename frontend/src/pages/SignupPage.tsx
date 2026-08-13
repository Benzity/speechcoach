import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

// 서버(app/services/password_policy.py)와 값을 맞춰야 한다.
const MIN_PASSWORD_LENGTH = 8

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [consentOverseas, setConsentOverseas] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const allConsented = consentPrivacy && consentOverseas

  function toggleAll(checked: boolean) {
    setConsentPrivacy(checked)
    setConsentOverseas(checked)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`)
      return
    }
    if (!birthDate) {
      setError('생년월일을 입력해주세요.')
      return
    }
    if (!allConsented) {
      setError('필수 항목에 모두 동의해야 가입할 수 있습니다.')
      return
    }
    setSubmitting(true)
    try {
      await signup(
        email.trim(),
        password,
        birthDate,
        { privacy: consentPrivacy, overseas: consentOverseas },
        displayName.trim() || undefined,
      )
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-6">
          <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-sky-500 to-blue-700 bg-clip-text text-transparent">
            SpeechCoach
          </span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl shadow-sky-100/40 p-8 border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">
            회원가입
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            계정을 만들면 면접 기록이 자동으로 누적 관리됩니다.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="이메일"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Field
              label="비밀번호"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={`${MIN_PASSWORD_LENGTH}자 이상`}
              autoComplete="new-password"
              required
              hint="길수록 안전합니다. 문장처럼 만들면 기억하기 쉽고 더 강력합니다."
            />
            <Field
              label="생년월일"
              type="date"
              value={birthDate}
              onChange={setBirthDate}
              autoComplete="bday"
              required
              hint="만 14세 이상만 가입할 수 있습니다. 확인 후 저장하지 않습니다."
            />
            <Field
              label="이름 (선택)"
              type="text"
              value={displayName}
              onChange={setDisplayName}
              placeholder="홍길동"
            />

            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allConsented}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400"
                />
                <span className="text-sm font-semibold text-slate-800">
                  아래 필수 항목에 모두 동의합니다
                </span>
              </label>

              {/* 개인정보보호위원회 「알기쉬운 개인정보 처리 동의 안내서」(2022.3)
                  4요소: 수집 항목 · 수집 목적 · 보유 및 이용기간 · 동의 거부 시 불이익.
                  항목은 '~등'으로 뭉뚱그리지 않고 구체적으로 나열해야 한다. */}
              <ConsentRow
                checked={consentPrivacy}
                onChange={setConsentPrivacy}
                label="[필수] 개인정보 수집·이용 동의"
              >
                <ConsentField label="수집 항목">
                  이메일, 비밀번호, 이름(선택), 이력서 내용, 관심 직무, 답변 녹화
                  영상(얼굴·음성), 음성 전사문, 시선·자세·말속도 분석 결과
                </ConsentField>
                <ConsentField label="수집 목적">
                  회원 식별 및 로그인, 맞춤 면접 질문 생성, 답변 분석을 통한 피드백
                  제공, 이용 기록 조회
                </ConsentField>
                <ConsentField label="보유 및 이용기간">
                  녹화 영상 <strong>30일</strong> · 분석 결과{' '}
                  <strong>6개월</strong> · 계정 정보는 탈퇴 시까지 (기간 경과 시
                  복구 불가능한 방법으로 자동 파기)
                </ConsentField>
                <ConsentField label="동의 거부 권리 및 불이익">
                  동의를 거부하실 수 있습니다. 다만 위 정보는 서비스 제공에 반드시
                  필요한 최소한의 정보이므로, 거부하시면 회원가입 및 면접 연습
                  서비스를 이용하실 수 없습니다.
                </ConsentField>
              </ConsentRow>

              <ConsentRow
                checked={consentOverseas}
                onChange={setConsentOverseas}
                label="[필수] 개인정보 국외 이전 동의"
              >
                <ConsentField label="이전받는 자 / 국가">
                  Anthropic, PBC (미국)
                </ConsentField>
                <ConsentField label="이전 항목">
                  이력서 텍스트(주민등록번호·연락처·주소·생년월일 자동 마스킹 후),
                  답변 전사문, 분석 지표
                </ConsentField>
                <ConsentField label="이전 목적 / 방법">
                  면접 질문 및 피드백 생성 · API 호출을 통한 전송(전송 구간 암호화)
                </ConsentField>
                <ConsentField label="보유 및 이용기간">
                  처리 목적 달성 시까지. 이전받는 자는 전송된 내용을 AI 모델 학습에
                  이용하지 않습니다.
                </ConsentField>
                <ConsentField label="동의 거부 권리 및 불이익">
                  동의를 거부하실 수 있습니다. 다만 면접 질문과 피드백 생성이 해외
                  AI 서비스에 의존하므로, 거부하시면 서비스를 이용하실 수 없습니다.
                </ConsentField>
              </ConsentRow>

              <div className="px-4 py-3">
                <Link
                  to="/privacy"
                  target="_blank"
                  className="text-xs text-blue-700 hover:underline"
                >
                  개인정보 처리방침 전문 보기 →
                </Link>
              </div>
            </div>

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !allConsented}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-700 text-white font-semibold py-3 rounded-xl shadow-md shadow-sky-300/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-semibold text-blue-700 hover:underline">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  hint,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  required?: boolean
  hint?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition"
      />
      {hint && <span className="text-xs text-slate-400 mt-1 block">{hint}</span>}
    </label>
  )
}

function ConsentRow({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 py-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-400 shrink-0"
        />
        <span className="text-sm font-medium text-slate-800">{label}</span>
      </label>
      <div className="mt-2 pl-7 space-y-1.5">{children}</div>
    </div>
  )
}

/** 동의 안내서가 요구하는 항목별 고지를 표 형태로 보여준다. */
function ConsentField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-xs leading-relaxed">
      <span className="text-slate-400 font-medium">{label}</span>
      <p className="text-slate-600 mt-0.5">{children}</p>
    </div>
  )
}
