export const ko = {
  loginTitle: '로그인',
  loginSubtitle: '면접 기록을 누적 관리하려면 로그인이 필요합니다.',
  email: '이메일',
  password: '비밀번호',
  loginSubmitting: '로그인 중...',
  loginSubmit: '로그인',
  noAccount: '아직 계정이 없으신가요?',
  signupLink: '회원가입',
  signupTitle: '회원가입',
  signupSubtitle: '계정을 만들면 면접 기록이 자동으로 누적 관리됩니다.',
  passwordPlaceholder: '8자 이상',
  passwordTooShort: '비밀번호는 8자 이상이어야 합니다.',
  passwordHint: '길수록 안전합니다. 문장처럼 만들면 기억하기 쉽고 더 강력합니다.',
  displayName: '이름 (선택)',
  displayNamePlaceholder: '홍길동',
  signupSubmitting: '가입 중...',
  signupSubmit: '회원가입',
  haveAccount: '이미 계정이 있으신가요?',
  loginLink: '로그인',

  // 만 14세 미만 확인 (개인정보 보호법 제22조의2)
  birthDate: '생년월일',
  birthDateHint: '만 14세 이상만 가입할 수 있습니다. 확인 후 저장하지 않습니다.',
  birthDateRequired: '생년월일을 입력해주세요.',

  // 수집·이용 및 국외이전 동의 (제15조·제22조·제28조의8)
  consentAgreeAll: '아래 필수 항목에 모두 동의합니다',
  consentRequired: '필수 항목에 모두 동의해야 가입할 수 있습니다.',
  consentPrivacyLabel: '[필수] 개인정보 수집·이용 동의',
  consentOverseasLabel: '[필수] 개인정보 국외 이전 동의',
  privacyPolicyLink: '개인정보 처리방침 전문 보기 →',

  // 동의 고지 4요소 — '알기쉬운 개인정보 처리 동의 안내서'(2022.3)
  fieldItems: '수집 항목',
  fieldPurpose: '수집 목적',
  fieldRetention: '보유 및 이용기간',
  fieldRefusal: '동의 거부 권리 및 불이익',
  fieldReceiver: '이전받는 자 / 국가',
  fieldTransferItems: '이전 항목',
  fieldTransferPurpose: '이전 목적 / 방법',

  privacyItems:
    '이메일, 비밀번호, 이름(선택), 이력서 내용, 관심 직무, 답변 녹화 영상(얼굴·음성), 음성 전사문, 시선·자세·말속도 분석 결과',
  privacyPurpose:
    '회원 식별 및 로그인, 맞춤 면접 질문 생성, 답변 분석을 통한 피드백 제공, 이용 기록 조회',
  privacyRetention:
    '녹화 영상 30일 · 분석 결과 6개월 · 계정 정보는 탈퇴 시까지 (기간 경과 시 복구 불가능한 방법으로 자동 파기)',
  privacyRefusal:
    '동의를 거부하실 수 있습니다. 다만 위 정보는 서비스 제공에 반드시 필요한 최소한의 정보이므로, 거부하시면 회원가입 및 면접 연습 서비스를 이용하실 수 없습니다.',

  overseasReceiver: 'Anthropic, PBC (미국)',
  overseasItems:
    '이력서 텍스트(주민등록번호·연락처·주소·생년월일 자동 마스킹 후), 답변 전사문, 분석 지표',
  overseasPurpose: '면접 질문 및 피드백 생성 · API 호출을 통한 전송(전송 구간 암호화)',
  overseasRetention:
    '처리 목적 달성 시까지. 이전받는 자는 전송된 내용을 AI 모델 학습에 이용하지 않습니다.',
  overseasRefusal:
    '동의를 거부하실 수 있습니다. 다만 면접 질문과 피드백 생성이 해외 AI 서비스에 의존하므로, 거부하시면 서비스를 이용하실 수 없습니다.',
}

export const en: Record<keyof typeof ko, string> = {
  loginTitle: 'Log in',
  loginSubtitle: 'Log in to keep track of your interview history.',
  email: 'Email',
  password: 'Password',
  loginSubmitting: 'Logging in...',
  loginSubmit: 'Log in',
  noAccount: "Don't have an account yet?",
  signupLink: 'Sign up',
  signupTitle: 'Sign up',
  signupSubtitle: 'Create an account and your interview history is saved automatically.',
  passwordPlaceholder: 'At least 8 characters',
  passwordTooShort: 'Password must be at least 8 characters.',
  passwordHint:
    'Longer is safer. A short sentence is easier to remember and harder to guess.',
  displayName: 'Name (optional)',
  displayNamePlaceholder: 'Jane Doe',
  signupSubmitting: 'Signing up...',
  signupSubmit: 'Sign up',
  haveAccount: 'Already have an account?',
  loginLink: 'Log in',

  birthDate: 'Date of birth',
  birthDateHint: 'You must be 14 or older. We verify your age but do not store it.',
  birthDateRequired: 'Please enter your date of birth.',

  consentAgreeAll: 'I agree to all required items below',
  consentRequired: 'You must agree to all required items to sign up.',
  consentPrivacyLabel: '[Required] Consent to collection and use of personal data',
  consentOverseasLabel: '[Required] Consent to overseas transfer of personal data',
  privacyPolicyLink: 'Read the full privacy policy →',

  fieldItems: 'Data collected',
  fieldPurpose: 'Purpose',
  fieldRetention: 'Retention period',
  fieldRefusal: 'Right to refuse and consequences',
  fieldReceiver: 'Recipient / Country',
  fieldTransferItems: 'Data transferred',
  fieldTransferPurpose: 'Purpose / Method',

  privacyItems:
    'Email, password, name (optional), resume content, target role, answer recordings (face and voice), speech transcripts, and analysis results for gaze, posture and speaking rate',
  privacyPurpose:
    'Account identification and login, tailored interview question generation, feedback from answer analysis, and access to your own history',
  privacyRetention:
    'Recordings 30 days · Analysis results 6 months · Account data until you delete your account (automatically destroyed beyond recovery once the period ends)',
  privacyRefusal:
    'You may refuse. However, this is the minimum data required to provide the service, so refusing means you cannot sign up or use the interview practice service.',

  overseasReceiver: 'Anthropic, PBC (United States)',
  overseasItems:
    'Resume text (after automatic masking of national ID, contact details, address and date of birth), answer transcripts, and analysis metrics',
  overseasPurpose:
    'Generating interview questions and feedback · Transmitted via API over an encrypted connection',
  overseasRetention:
    'Until the processing purpose is fulfilled. The recipient does not use the transferred content to train AI models.',
  overseasRefusal:
    'You may refuse. However, question and feedback generation depends on an overseas AI service, so refusing means you cannot use the service.',
}
