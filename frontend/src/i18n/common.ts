export const ko = {
  appTitle: 'SpeechCoach AI · 모의면접 코칭',
  loading: '로딩 중...',
  myHistory: '내 면접 기록',
  logout: '로그아웃',
  login: '로그인',
  signup: '회원가입',

  // AI 생성물 표시 — 인공지능 기본법 제31조
  aiBadge: 'AI 생성',
  aiBadgeAria: '이 내용은 생성형 인공지능이 작성했습니다',
  aiQuestionBadge: 'AI 생성 질문',
  aiQuestionBadgeAria: '이 질문은 생성형 인공지능이 만들었습니다',
  aiNotice:
    '이 서비스는 생성형 인공지능으로 면접 질문과 피드백을 만듭니다. 분석 점수는 연습을 돕기 위한 참고 지표이며 채용 결과를 예측하거나 대신하지 않습니다. 결과에 대해 설명을 요구하거나 이의를 제기하실 수 있습니다.',
}

export const en: Record<keyof typeof ko, string> = {
  appTitle: 'SpeechCoach AI · Mock Interview Coaching',
  loading: 'Loading...',
  myHistory: 'My Interviews',
  logout: 'Log out',
  login: 'Log in',
  signup: 'Sign up',

  aiBadge: 'AI generated',
  aiBadgeAria: 'This content was written by generative AI',
  aiQuestionBadge: 'AI generated question',
  aiQuestionBadgeAria: 'This question was created by generative AI',
  aiNotice:
    'This service uses generative AI to create interview questions and feedback. The scores are reference indicators to support practice — they do not predict or replace hiring decisions. You may request an explanation of, or object to, any result.',
}
