// dev: VITE_API_BASE 없음 → '' → '/api/...' → Vite proxy로 127.0.0.1:8002
// prod(옵션 A): 백엔드가 frontend도 같이 서빙 → 같은 origin → VITE_API_BASE 비워둠
import { t } from './i18n'

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

// ngrok 무료 플랜 브라우저 경고 페이지 우회
const EXTRA_HEADERS: HeadersInit = API_BASE ? { 'ngrok-skip-browser-warning': 'true' } : {}

const TOKEN_KEY = 'speechcoach.token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function authedFetch(
  url: string,
  init: RequestInit = {},
  redirectOn401 = true,
): Promise<Response> {
  const headers = { ...EXTRA_HEADERS, ...authHeaders(), ...(init.headers ?? {}) }
  const res = await fetch(url, { ...init, headers })
  if (res.status === 401) {
    clearToken()
    // redirectOn401=false: 초기 인증 확인(apiMe) 등은 공개 페이지에서 만료 토큰이어도
    // /login으로 튕기지 않는다. 비로그인 상태로 처리만 한다.
    if (redirectOn401) {
      const path = window.location.pathname
      if (path !== '/login' && path !== '/signup') {
        window.location.href = '/login'
      }
    }
  }
  return res
}

export type QuestionRead = {
  id: string
  q_index: number
  text: string
  category: string | null
  intent: string | null
}

export type SessionStatus = 'created' | 'in_progress' | 'analyzing' | 'completed' | 'failed'
export type AnalysisStatusName = 'queued' | 'processing' | 'completed' | 'failed'
export type InterviewLanguage = 'ko' | 'en'

export type SessionRead = {
  id: string
  job_title: string
  question_count: number
  language: InterviewLanguage
  status: SessionStatus
  questions: QuestionRead[]
  created_at: string
}

export type AnswerUploadResponse = {
  question_id: string
  q_index: number
  status: AnalysisStatusName
}

export type AnalysisStatus = {
  total: number
  queued: number
  in_progress: number
  completed: number
  failed: number
}

export type AnalysisRead = {
  question_id: string
  status: AnalysisStatusName
  asr_transcript: string | null
  asr_segments_json: string | null
  nonverbal_metrics_json: string | null
  verbal_metrics_json: string | null
}

export type FeedbackRead = {
  session_id: string
  llm_response_json: string
  created_at: string
}

export type ResultResponse = {
  session: SessionRead
  analyses: AnalysisRead[]
  feedback: FeedbackRead | null
}

export type FeedbackJson = {
  overall_summary: string
  scores: { content: number; nonverbal: number | null; verbal: number; overall: number }
  critical_issues: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[]
  nonverbal_feedback: string
  verbal_feedback: string
  practice_tips: string[]
  positive_points: string[]
}

// ===== Auth =====
export type UserRead = {
  id: string
  email: string
  display_name: string | null
  created_at: string
}

type TokenResponse = { access_token: string; token_type: string }

export type SessionListItem = {
  id: string
  job_title: string
  question_count: number
  language: InterviewLanguage
  status: SessionStatus
  created_at: string
  overall_score: number | null
}

type CreateSessionInput = {
  jobTitle: string
  resumeText?: string
  resumePdf?: File
  idealProfile?: string
  questionCount: number
  language: InterviewLanguage
}

async function jsonOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error((data as { detail?: string } | null)?.detail ?? fallback)
  }
  return res.json() as Promise<T>
}

export type SignupConsents = {
  /** 개인정보 수집·이용 동의 (필수, 제15조·제22조) */
  privacy: boolean
  /** 개인정보 국외이전 동의 (필수, 제28조의8) — Claude API(미국) 전송 */
  overseas: boolean
}

export async function apiSignup(
  email: string,
  password: string,
  /** YYYY-MM-DD. 만 14세 확인용이며 서버에 저장되지 않는다 (제22조의2). */
  birthDate: string,
  consents: SignupConsents,
  displayName?: string,
): Promise<TokenResponse> {
  const res = await authedFetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      birth_date: birthDate,
      display_name: displayName,
      consent_privacy: consents.privacy,
      consent_overseas: consents.overseas,
    }),
  })
  return jsonOrThrow<TokenResponse>(res, t('errors.signupFailed'))
}

/** 로그아웃 — 서버에서 토큰을 무효화한 뒤 로컬 토큰을 지운다. */
export async function apiLogout(): Promise<void> {
  try {
    await authedFetch(`${API_BASE}/api/auth/logout`, { method: 'POST' }, false)
  } finally {
    // 서버 호출이 실패해도 로컬 토큰은 반드시 제거한다.
    clearToken()
  }
}

/** 회원 탈퇴 — 계정·세션·영상이 전부 삭제된다 (되돌릴 수 없음). */
export async function apiDeleteAccount(): Promise<void> {
  const res = await authedFetch(`${API_BASE}/api/auth/me`, { method: 'DELETE' }, false)
  if (!res.ok && res.status !== 401) {
    throw new Error(`탈퇴 처리에 실패했습니다 (${res.status})`)
  }
  clearToken()
}

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  const res = await authedFetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return jsonOrThrow<TokenResponse>(res, t('errors.loginFailed'))
}

export async function apiMe(): Promise<UserRead> {
  const res = await authedFetch(`${API_BASE}/api/auth/me`, {}, false)
  return jsonOrThrow<UserRead>(res, t('errors.meFailed'))
}

export async function listMySessions(): Promise<SessionListItem[]> {
  const res = await authedFetch(`${API_BASE}/api/me/sessions`)
  return jsonOrThrow<SessionListItem[]>(res, t('errors.historyFailed'))
}

export async function deleteSession(sessionId: string): Promise<void> {
  const res = await authedFetch(`${API_BASE}/api/sessions/${sessionId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(t('errors.deleteFailed', { status: res.status }))
}

// ===== Sessions =====
export async function createSession(input: CreateSessionInput): Promise<SessionRead> {
  const form = new FormData()
  form.append('job_title', input.jobTitle)
  if (input.resumePdf) form.append('resume_pdf', input.resumePdf)
  else if (input.resumeText) form.append('resume_text', input.resumeText)
  if (input.idealProfile) form.append('ideal_profile', input.idealProfile)
  form.append('question_count', String(input.questionCount))
  form.append('language', input.language)
  const res = await authedFetch(`${API_BASE}/api/sessions`, { method: 'POST', body: form })
  return jsonOrThrow<SessionRead>(res, t('errors.requestFailed', { status: res.status }))
}

export async function getSession(sessionId: string): Promise<SessionRead> {
  const res = await authedFetch(`${API_BASE}/api/sessions/${sessionId}`)
  return jsonOrThrow<SessionRead>(res, t('errors.sessionFailed'))
}

export async function uploadAnswer(
  sessionId: string,
  qIndex: number,
  video: Blob,
): Promise<AnswerUploadResponse> {
  const form = new FormData()
  form.append('video', video, `${qIndex}.webm`)
  const res = await authedFetch(`${API_BASE}/api/sessions/${sessionId}/answers/${qIndex}`, {
    method: 'POST',
    body: form,
  })
  return jsonOrThrow<AnswerUploadResponse>(res, t('errors.uploadFailed', { status: res.status }))
}

export async function getAnalysisStatus(sessionId: string): Promise<AnalysisStatus> {
  const res = await authedFetch(`${API_BASE}/api/sessions/${sessionId}/analysis-status`)
  return jsonOrThrow<AnalysisStatus>(res, t('errors.analysisStatusFailed'))
}

export async function triggerFeedback(
  sessionId: string,
): Promise<{ session_id: string; status: string }> {
  const res = await authedFetch(`${API_BASE}/api/sessions/${sessionId}/feedback`, { method: 'POST' })
  return jsonOrThrow(res, t('errors.feedbackFailed'))
}

export async function getResult(sessionId: string): Promise<ResultResponse> {
  const res = await authedFetch(`${API_BASE}/api/sessions/${sessionId}/result`)
  return jsonOrThrow<ResultResponse>(res, t('errors.resultFailed'))
}

export function getVideoUrl(sessionId: string, qIndex: number): string {
  return `${API_BASE}/api/sessions/${sessionId}/answers/${qIndex}/video`
}

// <video src>는 Authorization 헤더를 못 보내므로, 인증된 fetch로 blob을 받아 URL.createObjectURL 사용.
export async function fetchVideoBlob(sessionId: string, qIndex: number): Promise<Blob> {
  const res = await authedFetch(`${API_BASE}/api/sessions/${sessionId}/answers/${qIndex}/video`)
  if (!res.ok) throw new Error(t('errors.videoFailed', { status: res.status }))
  return res.blob()
}
