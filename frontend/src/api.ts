// dev: VITE_API_BASE 없음 → '' → '/api/...' → Vite proxy로 127.0.0.1:8000
// prod(Netlify 등): VITE_API_BASE='https://backend.example.com' → 절대 URL 호출 + 백엔드 CORS
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? ''

// ngrok 무료 플랜 브라우저 경고 페이지 우회
const EXTRA_HEADERS: HeadersInit = API_BASE ? { 'ngrok-skip-browser-warning': 'true' } : {}

export type QuestionRead = {
  id: string
  q_index: number
  text: string
  category: string | null
  intent: string | null
}

export type SessionStatus = 'created' | 'in_progress' | 'analyzing' | 'completed' | 'failed'
export type AnalysisStatusName = 'queued' | 'processing' | 'completed' | 'failed'

export type SessionRead = {
  id: string
  job_title: string
  question_count: number
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
  scores: { content: number; nonverbal: number; verbal: number; overall: number }
  critical_issues: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[]
  nonverbal_feedback: string
  verbal_feedback: string
  practice_tips: string[]
  positive_points: string[]
}

type CreateSessionInput = {
  jobTitle: string
  resumeText?: string
  resumePdf?: File
  idealProfile?: string
  questionCount: number
}

async function jsonOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error((data as { detail?: string } | null)?.detail ?? fallback)
  }
  return res.json() as Promise<T>
}

export async function createSession(input: CreateSessionInput): Promise<SessionRead> {
  const form = new FormData()
  form.append('job_title', input.jobTitle)
  if (input.resumePdf) form.append('resume_pdf', input.resumePdf)
  else if (input.resumeText) form.append('resume_text', input.resumeText)
  if (input.idealProfile) form.append('ideal_profile', input.idealProfile)
  form.append('question_count', String(input.questionCount))
  const res = await fetch(`${API_BASE}/api/sessions`, { method: 'POST', headers: EXTRA_HEADERS, body: form })
  return jsonOrThrow<SessionRead>(res, `요청 실패 (${res.status})`)
}

export async function getSession(sessionId: string): Promise<SessionRead> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`, { headers: EXTRA_HEADERS })
  return jsonOrThrow<SessionRead>(res, '세션을 불러올 수 없습니다.')
}

export async function uploadAnswer(
  sessionId: string,
  qIndex: number,
  video: Blob,
): Promise<AnswerUploadResponse> {
  const form = new FormData()
  form.append('video', video, `${qIndex}.webm`)
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/answers/${qIndex}`, {
    method: 'POST',
    headers: EXTRA_HEADERS,
    body: form,
  })
  return jsonOrThrow<AnswerUploadResponse>(res, `업로드 실패 (${res.status})`)
}

export async function getAnalysisStatus(sessionId: string): Promise<AnalysisStatus> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/analysis-status`, { headers: EXTRA_HEADERS })
  return jsonOrThrow<AnalysisStatus>(res, '분석 상태 조회 실패')
}

export async function triggerFeedback(
  sessionId: string,
): Promise<{ session_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/feedback`, { method: 'POST', headers: EXTRA_HEADERS })
  return jsonOrThrow(res, '종합 피드백 생성에 실패했습니다.')
}

export async function getResult(sessionId: string): Promise<ResultResponse> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/result`, { headers: EXTRA_HEADERS })
  return jsonOrThrow<ResultResponse>(res, '결과를 불러올 수 없습니다.')
}

export function getVideoUrl(sessionId: string, qIndex: number): string {
  return `${API_BASE}/api/sessions/${sessionId}/answers/${qIndex}/video`
}
