// api.ts의 fallback 에러 메시지. 서버가 detail을 주면 그것이 우선된다.
export const ko = {
  signupFailed: '회원가입에 실패했습니다.',
  loginFailed: '로그인에 실패했습니다.',
  meFailed: '내 정보를 불러올 수 없습니다.',
  historyFailed: '히스토리를 불러올 수 없습니다.',
  deleteFailed: '삭제 실패 ({status})',
  requestFailed: '요청 실패 ({status})',
  sessionFailed: '세션을 불러올 수 없습니다.',
  uploadFailed: '업로드 실패 ({status})',
  analysisStatusFailed: '분석 상태 조회 실패',
  feedbackFailed: '종합 피드백 생성에 실패했습니다.',
  resultFailed: '결과를 불러올 수 없습니다.',
  videoFailed: '영상 로드 실패 ({status})',
}

export const en: Record<keyof typeof ko, string> = {
  signupFailed: 'Sign-up failed.',
  loginFailed: 'Login failed.',
  meFailed: 'Could not load your account info.',
  historyFailed: 'Could not load your history.',
  deleteFailed: 'Delete failed ({status})',
  requestFailed: 'Request failed ({status})',
  sessionFailed: 'Could not load the session.',
  uploadFailed: 'Upload failed ({status})',
  analysisStatusFailed: 'Could not check analysis status.',
  feedbackFailed: 'Failed to generate overall feedback.',
  resultFailed: 'Could not load the results.',
  videoFailed: 'Could not load the video ({status})',
}
