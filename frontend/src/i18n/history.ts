export const ko = {
  statusCreated: '진행 전',
  statusInProgress: '진행 중',
  statusAnalyzing: '분석 중',
  statusCompleted: '완료',
  statusFailed: '실패',
  title: '내 면접 기록',
  subtitle: '지난 모의면접과 점수를 한눈에 확인하세요.',
  newInterview: '+ 새 면접 시작',
  loading: '불러오는 중...',
  emptyMessage: '아직 진행한 면접이 없어요.',
  startFirstInterview: '첫 면접 시작하기',
  deleteConfirm: '정말 이 면접 기록을 삭제할까요? 영상도 함께 삭제됩니다.',
  deleteTitle: '삭제',
  questionCount: '질문 {count}개',

  // 회원 탈퇴 — 처리방침 9항의 '처리정지 및 동의 철회' 행사 수단.
  // 문구를 바꾸면 i18n/privacy.ts의 s9Item3·s6aRefuse와 어긋나지 않는지 확인할 것.
  accountTitle: '계정 관리',
  accountDeleteLabel: '회원 탈퇴',
  accountDeleteHint:
    '탈퇴하면 계정 정보와 모든 면접 기록·녹화 영상·분석 결과가 지체 없이 삭제되며, 개인정보 수집·이용 및 국외 이전 동의도 함께 철회됩니다. 삭제된 데이터는 복구할 수 없습니다.',
  accountDeleteConfirm:
    '정말 탈퇴하시겠습니까?\n\n계정과 모든 면접 기록·영상·분석 결과가 삭제되며 복구할 수 없습니다.',
  accountDeleting: '탈퇴 처리 중...',
}

export const en: Record<keyof typeof ko, string> = {
  statusCreated: 'Not started',
  statusInProgress: 'In progress',
  statusAnalyzing: 'Analyzing',
  statusCompleted: 'Completed',
  statusFailed: 'Failed',
  title: 'My Interview History',
  subtitle: 'Review your past mock interviews and scores at a glance.',
  newInterview: '+ New Interview',
  loading: 'Loading...',
  emptyMessage: "You haven't done any interviews yet.",
  startFirstInterview: 'Start your first interview',
  deleteConfirm: 'Delete this interview record? The video will be deleted as well.',
  deleteTitle: 'Delete',
  questionCount: '{count} questions',

  accountTitle: 'Account',
  accountDeleteLabel: 'Delete account',
  accountDeleteHint:
    'Closing your account deletes your account details and every interview record, recording and analysis result without delay, and withdraws your consent to the collection, use and overseas transfer of your personal data. Deleted data cannot be recovered.',
  accountDeleteConfirm:
    'Delete your account?\n\nYour account and every interview record, recording and analysis result will be deleted and cannot be recovered.',
  accountDeleting: 'Deleting...',
}
