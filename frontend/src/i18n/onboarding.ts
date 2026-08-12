export const ko = {
  // 로딩 화면
  loadingTitle: '맞춤 면접 질문을 생성하고 있습니다',
  loadingSubtitle: '평균 10초 정도 걸립니다',

  // 헤더
  title: '면접 정보를 입력해주세요',
  subtitle: '직무와 이력서를 알려주시면 맞춤 질문을 생성합니다.',

  // 관심 직무
  jobTitleLabel: '관심 직무',
  jobTitlePlaceholder: '예: 백엔드 개발자, 데이터 분석가, 마케팅 매니저…',

  // 이력서
  resumeLabel: '이력서',
  resumeTabText: '텍스트 입력',
  resumeTabPdf: 'PDF 업로드',
  resumeTextPlaceholder: '이력서 내용을 자유 형식으로 붙여넣어주세요. (최대 5,000자)',
  resumePdfDrop: 'PDF 파일을 선택하거나 끌어다 놓으세요',
  resumePdfMax: '최대 10MB',

  // 목표 회사
  companyLabel: '목표 회사 (선택)',
  companyHint: '선택하면 아래 인재상 칸에 해당 회사 기준이 자동 입력됩니다. 자유롭게 수정 가능합니다.',
  companyNone: '— 선택 안 함 / 직접 입력 —',
  companySamsung: '삼성전자',
  companySkhynix: 'SK하이닉스',
  companyLg: 'LG전자',
  companyNaver: '네이버',
  companyKakao: '카카오',
  companyCoupang: '쿠팡',
  companyToss: '토스',
  profileSamsung:
    '경계를 넘는 도전과 창의로 미래를 개척하는 인재. 함께 멀리 가는 협업, 끊임없는 학습으로 본질을 추구하고, 글로벌 무대에서 통하는 실행력과 책임감을 갖춘 사람.',
  profileSkhynix:
    '도전과 패기로 새로운 영역을 개척하고, 데이터·기술 기반의 빠른 의사결정과 실행을 추구. 사회적 가치(ESG)와 협업을 중시하며 자기주도적으로 성장하는 인재.',
  profileLg:
    '고객가치 창조와 인간존중. 정도 경영을 바탕으로 끈기 있게 본질에 집중하고, 협업과 신뢰로 변화의 시대를 함께 만들어가는 인재.',
  profileNaver:
    '사용자 중심 사고와 기술에 대한 깊은 이해. 빠른 학습과 실험, 데이터 기반 의사결정을 통해 더 나은 인터넷 서비스를 만드는 인재. 자율과 책임의 문화에 기여할 수 있는 사람.',
  profileKakao:
    '사람을 향한 따뜻한 기술. 자율과 책임 위에서 본질 문제에 집중하고, 동료와 솔직하게 소통하며 실행하는 인재.',
  profileCoupang:
    '와우(WOW) 경험에 집착하는 고객 obsession. 데이터·실험 기반 의사결정과 빠른 실행, 주인의식과 lean한 문제 해결로 임팩트를 내는 인재.',
  profileToss:
    '고객 문제를 끝까지 파고드는 깊이 있는 사고와 빠른 실행. 자율적인 의사결정과 강한 주인의식, 솔직한 피드백 문화에 적응할 수 있는 인재.',

  // 인재상
  idealLabel: '인재상 (선택)',
  idealPlaceholder: '예: 주도적으로 문제를 해결하는 인재, 협업을 중시하는 문화, 빠른 실행력과 데이터 기반 사고…',
  idealHint: '입력하면 해당 인재상 기준으로 질문과 피드백이 맞춤 생성됩니다.',

  // 질문 개수
  questionCountLabel: '질문 개수: {count}개',
  sliderMin: '3개 (5분)',
  sliderRecommended: '권장 5~7개',
  sliderMax: '15개 (20분)',

  // 면접 언어
  languageLabel: '면접 언어',
  languageHint: '선택한 언어로 면접 질문과 피드백이 생성됩니다.',
  languageKo: '한국어',
  languageEn: 'English',

  // 에러/제출
  errorTitle: '질문 생성 실패',
  errorRetry: '잠시 후 다시 시도해주세요.',
  unknownError: '알 수 없는 오류가 발생했습니다.',
  submit: '질문 생성 시작',

  // DeviceTest
  deviceTitle: '카메라·마이크 테스트',
  deviceSubtitle: '면접 시작 전, 장치가 정상 작동하는지 미리 확인하세요.',
  deviceStop: '중지',
  deviceStart: '테스트 시작',
  deviceRequesting: '권한 요청 중…',
  deviceIdleOverlay: '테스트 시작을 눌러주세요',
  deviceNoCamera: '카메라 없음',
  deviceMicLabel: '마이크 입력',
  deviceMicGood: '소리가 잘 들립니다',
  deviceMicSpeak: '말을 해보세요',
  deviceMicWaiting: '대기 중',
  devicePermissionDenied: '권한이 거부되었습니다. 브라우저 주소창의 권한 아이콘에서 허용해주세요.',
  deviceNotFound: '카메라/마이크 장치를 찾을 수 없습니다.',
}

export const en: Record<keyof typeof ko, string> = {
  // Loading screen
  loadingTitle: 'Generating your personalized interview questions',
  loadingSubtitle: 'This usually takes about 10 seconds',

  // Header
  title: 'Tell us about your interview',
  subtitle: 'Share your target role and resume, and we will generate tailored questions.',

  // Job title
  jobTitleLabel: 'Target role',
  jobTitlePlaceholder: 'e.g. Backend Engineer, Data Analyst, Marketing Manager…',

  // Resume
  resumeLabel: 'Resume',
  resumeTabText: 'Enter text',
  resumeTabPdf: 'Upload PDF',
  resumeTextPlaceholder: 'Paste your resume in any format. (Up to 5,000 characters)',
  resumePdfDrop: 'Select or drag & drop a PDF file',
  resumePdfMax: 'Up to 10MB',

  // Target company
  companyLabel: 'Target company (optional)',
  companyHint: 'Selecting one auto-fills the ideal candidate profile below with that company’s criteria. Feel free to edit it.',
  companyNone: '— None / enter manually —',
  companySamsung: 'Samsung Electronics',
  companySkhynix: 'SK hynix',
  companyLg: 'LG Electronics',
  companyNaver: 'NAVER',
  companyKakao: 'Kakao',
  companyCoupang: 'Coupang',
  companyToss: 'Toss',
  profileSamsung:
    'Someone who pioneers the future through boundary-crossing challenges and creativity. A person who collaborates to go far together, relentlessly learns to pursue the essence of things, and brings the execution and sense of responsibility to succeed on the global stage.',
  profileSkhynix:
    'Someone who breaks new ground with courage and drive, and pursues fast, data- and technology-driven decision-making and execution. A person who values social value (ESG) and collaboration, and grows in a self-directed way.',
  profileLg:
    'Creating value for customers and respecting people. Someone who, grounded in principled ("Jeong-Do") management, focuses persistently on what matters most, and shapes an era of change together through collaboration and trust.',
  profileNaver:
    'User-centered thinking and a deep understanding of technology. Someone who builds better internet services through fast learning, experimentation, and data-driven decision-making. A person who can contribute to a culture of autonomy and responsibility.',
  profileKakao:
    'Technology with warmth toward people. Someone who, on a foundation of autonomy and responsibility, focuses on the essential problems and executes while communicating honestly with colleagues.',
  profileCoupang:
    'Customer obsession devoted to delivering the "Wow" experience. Someone who creates impact through data- and experiment-driven decisions, fast execution, a strong sense of ownership, and lean problem-solving.',
  profileToss:
    'Deep thinking that digs into customer problems to the very end, paired with fast execution. Someone with autonomous decision-making, a strong sense of ownership, and the ability to thrive in a culture of candid feedback.',

  // Ideal candidate profile
  idealLabel: 'Ideal candidate profile (optional)',
  idealPlaceholder: 'e.g. Solves problems proactively, values collaboration, fast execution and data-driven thinking…',
  idealHint: 'If provided, questions and feedback will be tailored to this profile.',

  // Question count
  questionCountLabel: 'Number of questions: {count}',
  sliderMin: '3 (5 min)',
  sliderRecommended: '5–7 recommended',
  sliderMax: '15 (20 min)',

  // Interview language
  languageLabel: 'Interview language',
  languageHint: 'Interview questions and feedback will be generated in the selected language.',
  languageKo: '한국어',
  languageEn: 'English',

  // Error / submit
  errorTitle: 'Failed to generate questions',
  errorRetry: 'Please try again in a moment.',
  unknownError: 'An unknown error occurred.',
  submit: 'Generate questions',

  // DeviceTest
  deviceTitle: 'Camera & microphone test',
  deviceSubtitle: 'Before starting the interview, make sure your devices are working properly.',
  deviceStop: 'Stop',
  deviceStart: 'Start test',
  deviceRequesting: 'Requesting permission…',
  deviceIdleOverlay: 'Press "Start test"',
  deviceNoCamera: 'No camera',
  deviceMicLabel: 'Mic input',
  deviceMicGood: 'Sounding good',
  deviceMicSpeak: 'Try speaking',
  deviceMicWaiting: 'Waiting',
  devicePermissionDenied: 'Permission was denied. Please allow access via the permission icon in your browser’s address bar.',
  deviceNotFound: 'No camera/microphone device found.',
}
