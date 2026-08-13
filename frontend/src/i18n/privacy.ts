// 개인정보 처리방침 (개인정보 보호법 제30조).
// 보유기간·수집항목은 실제 코드 동작과 일치해야 한다.
// 변경 시 backend/app/services/retention.py 및 동의 화면(auth.ts)도 함께 수정할 것.
export const ko = {
  backHome: '← 홈으로',
  title: '개인정보 처리방침',
  effective: '시행일: {date}',

  // 1. 처리하는 개인정보 항목
  s1Title: '1. 처리하는 개인정보 항목',
  s1ColType: '구분',
  s1ColItem: '항목',
  s1ColMethod: '수집 방법',
  s1Required: '필수',
  s1Optional: '선택',
  s1Auto: '자동생성',
  s1ItemAccount: '이메일, 비밀번호(암호화 저장)',
  s1MethodSignup: '회원가입 시 입력',
  s1ItemName: '이름',
  s1ItemResume: '이력서 텍스트 또는 PDF 파일',
  s1MethodSession: '면접 세션 생성 시 입력·업로드',
  s1ItemJob: '관심 직무',
  s1MethodSessionInput: '면접 세션 생성 시 입력',
  s1ItemVideo: '답변 녹화 영상(얼굴·음성 포함)',
  s1MethodRecord: '면접 진행 중 녹화',
  s1ItemAnalysis:
    '음성 전사문, 시선·자세·손 움직임 지표, 말 속도·피치 등 분석 결과',
  s1MethodAnalysis: '업로드된 영상 분석 과정에서 생성',
  s1NoteMasking:
    '이력서에 포함된 주민등록번호·전화번호·이메일·주소·생년월일은 외부 AI 서비스로 전송되기 전에 자동으로 가려집니다.',
  s1NoteBirth:
    '회원가입 시 만 14세 이상 여부를 확인하기 위해 생년월일을 입력받으나, 확인 후 저장하지 않으며 확인을 마친 시각만 기록합니다.',

  // 1-1. 아동
  s1aTitle: '1-1. 만 14세 미만 아동의 개인정보',
  s1aBody:
    '본 서비스는 취업 준비를 지원하는 서비스로 만 14세 미만 아동의 가입을 받지 않습니다. 회원가입 시 연령을 확인하여 만 14세 미만인 경우 가입이 제한되며, 아동의 개인정보를 수집·이용하지 않습니다.',

  // 2. 처리 목적
  s2Title: '2. 개인정보의 처리 목적',
  s2Item1: '회원 식별 및 로그인 등 서비스 제공',
  s2Item2: '이력서·직무 기반 맞춤 면접 질문 생성',
  s2Item3: '답변 영상 분석을 통한 비언어·언어 표현 피드백 제공',
  s2Item4: '이용 이력 조회 및 회차 간 비교 기능 제공',
  s2Note:
    '위 목적 이외의 용도로는 이용하지 않으며, 목적이 변경되는 경우 사전에 동의를 받습니다.',

  // 3. 보유 및 파기
  s3Title: '3. 개인정보의 보유 및 파기',
  s3ColData: '데이터',
  s3ColPeriod: '보유기간',
  s3ColMethod: '파기 방법',
  s3Video: '답변 녹화 영상',
  s3VideoPeriod: '수집일로부터 30일',
  s3VideoMethod: '자동 삭제(복구 불가)',
  s3Analysis: '분석 결과 및 전사문',
  s3AnalysisPeriod: '수집일로부터 6개월',
  s3AnalysisMethod: '보유기간 경과 시 자동 삭제',
  s3Account: '계정 정보',
  s3AccountPeriod: '회원 탈퇴 시까지',
  s3AccountMethod: '탈퇴 즉시 전부 삭제',
  s3Note:
    '보유기간이 지난 정보는 자동으로 파기되며, 회원 탈퇴 시 위 정보 전체가 지체 없이 삭제됩니다.',
  s3Destroy:
    '파기 방법 — 전자적 파일은 복원이 불가능하도록 저장 영역을 덮어쓴 후 삭제하며, 데이터베이스에서 삭제된 기록은 잔여 영역까지 회수하여 복구할 수 없도록 처리합니다.',
  s3AccessLog:
    '단, 접속기록은 「개인정보의 안전성 확보조치 기준」 제8조에 따라 2년간 별도 보관됩니다.',

  // 4. 국외 이전
  s4Title: '4. 개인정보의 국외 이전',
  s4Intro:
    '면접 질문 생성 및 종합 피드백 작성을 위해 아래와 같이 개인정보를 국외로 이전합니다. 이용자는 동의를 거부할 수 있으나, 동의하지 않는 경우 서비스 이용이 제한됩니다.',
  s4ColItem: '항목',
  s4ColDetail: '내용',
  s4Receiver: '이전받는 자',
  s4ReceiverVal: 'Anthropic, PBC',
  s4Country: '이전 국가',
  s4CountryVal: '미국',
  s4Items: '이전 항목',
  s4ItemsVal: '이력서 텍스트(식별정보 제거 후), 답변 전사문, 분석 지표',
  s4Purpose: '이전 목적',
  s4PurposeVal: '면접 질문 생성 및 피드백 작성',
  s4Method: '이전 방법',
  s4MethodVal: 'API 호출을 통한 네트워크 전송(전송 구간 암호화)',
  s4Period: '보유 기간',
  s4PeriodVal: '처리 목적 달성 시까지',

  // 5. AI
  s5Title: '5. 인공지능 기술의 이용',
  s5Body1:
    '본 서비스는 면접 질문과 피드백을 생성형 인공지능으로 작성합니다. 해당 결과물에는 AI가 생성했다는 표시가 함께 제공됩니다.',
  s5Body2:
    '분석 점수는 연습을 돕기 위한 참고 지표이며, 채용 여부 등 이용자의 권리·의무에 영향을 미치는 결정에 사용되지 않습니다. 결과에 대해 설명을 요구하거나 이의를 제기하실 수 있습니다.',

  // 6. 권리
  s6Title: '6. 정보주체의 권리와 행사 방법',
  s6Item1: '개인정보 열람 요구 — 서비스 내 이용 기록 화면에서 확인',
  s6Item2: '정정·삭제 요구 — 개별 세션 삭제 기능 제공',
  s6Item3: '처리정지 및 동의 철회 — 회원 탈퇴로 전체 삭제 가능',
  s6Item4: '위 권리 행사는 아래 연락처를 통해서도 요청하실 수 있습니다',

  // 7. 안전성 확보조치
  s7Title: '7. 개인정보의 안전성 확보 조치',
  s7Item1: '비밀번호 일방향 암호화 저장(bcrypt)',
  s7Item2:
    '답변 녹화 영상 암호화 저장(AES-256) — 저장 매체가 유출되더라도 내용을 열람할 수 없습니다',
  s7Item3: '로그인 시도 횟수 제한 및 접근 제한',
  s7Item4: '외부 전송 전 이력서 내 식별정보 자동 마스킹',
  s7Item5: '보유기간 경과 데이터 자동 파기(복원 불가 방식)',
  s7Item6: '본인 데이터에만 접근 가능하도록 하는 접근 통제',
  s7Item7: '개인정보처리시스템 접속기록 2년간 보관 및 월 1회 이상 점검',

  // 8. 보호책임자
  s8Title: '8. 개인정보 보호책임자',
  s8ColType: '구분',
  s8ColDetail: '내용',
  s8Operator: '운영자',
  s8Dpo: '보호책임자',
  s8Contact: '연락처',
  s8Note:
    '개인정보 침해에 대한 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번없이 118) 또는 개인정보보호위원회(privacy.go.kr)로 문의하실 수 있습니다.',

  // 9. 변경
  s9Title: '9. 처리방침의 변경',
  s9Body:
    '본 처리방침이 변경되는 경우 변경 사항을 시행 7일 전부터 서비스 내에 공지합니다. 다만 이용자 권리에 중대한 영향을 미치는 변경은 30일 전에 공지하고 필요한 경우 동의를 다시 받습니다.',
}

export const en: Record<keyof typeof ko, string> = {
  backHome: '← Home',
  title: 'Privacy Policy',
  effective: 'Effective date: {date}',

  s1Title: '1. Personal data we process',
  s1ColType: 'Type',
  s1ColItem: 'Data',
  s1ColMethod: 'How it is collected',
  s1Required: 'Required',
  s1Optional: 'Optional',
  s1Auto: 'Generated',
  s1ItemAccount: 'Email, password (stored encrypted)',
  s1MethodSignup: 'Entered at sign-up',
  s1ItemName: 'Name',
  s1ItemResume: 'Resume text or PDF file',
  s1MethodSession: 'Entered or uploaded when creating a session',
  s1ItemJob: 'Target role',
  s1MethodSessionInput: 'Entered when creating a session',
  s1ItemVideo: 'Answer recordings (including face and voice)',
  s1MethodRecord: 'Recorded during the interview',
  s1ItemAnalysis:
    'Speech transcripts, gaze/posture/hand-movement metrics, speaking rate and pitch results',
  s1MethodAnalysis: 'Generated while analysing the uploaded recording',
  s1NoteMasking:
    'National ID numbers, phone numbers, email addresses, postal addresses and dates of birth found in a resume are masked automatically before anything is sent to the external AI service.',
  s1NoteBirth:
    'We ask for your date of birth at sign-up only to confirm you are 14 or older. It is not stored — we keep only the time the check was completed.',

  s1aTitle: '1-1. Personal data of children under 14',
  s1aBody:
    'This service supports job preparation and does not accept members under the age of 14. Age is verified at sign-up and accounts are refused below that age, so we do not collect or use any personal data of children.',

  s2Title: '2. Purpose of processing',
  s2Item1: 'Account identification, login and service delivery',
  s2Item2: 'Generating interview questions tailored to your resume and target role',
  s2Item3: 'Providing verbal and non-verbal feedback from answer analysis',
  s2Item4: 'Letting you review your history and compare sessions',
  s2Note:
    'We do not use the data for any other purpose. If the purpose changes, we will obtain your consent in advance.',

  s3Title: '3. Retention and destruction',
  s3ColData: 'Data',
  s3ColPeriod: 'Retention',
  s3ColMethod: 'Destruction',
  s3Video: 'Answer recordings',
  s3VideoPeriod: '30 days from collection',
  s3VideoMethod: 'Deleted automatically, beyond recovery',
  s3Analysis: 'Analysis results and transcripts',
  s3AnalysisPeriod: '6 months from collection',
  s3AnalysisMethod: 'Deleted automatically once the period ends',
  s3Account: 'Account data',
  s3AccountPeriod: 'Until you delete your account',
  s3AccountMethod: 'Deleted in full immediately on withdrawal',
  s3Note:
    'Data past its retention period is destroyed automatically, and everything above is deleted without delay when you close your account.',
  s3Destroy:
    'Method — electronic files are overwritten before deletion so they cannot be restored, and records removed from the database are cleared down to the residual storage area.',
  s3AccessLog:
    'Access logs are retained separately for two years under Article 8 of the Standards for Ensuring the Safety of Personal Information.',

  s4Title: '4. Transfer of personal data overseas',
  s4Intro:
    'To generate interview questions and feedback, we transfer personal data overseas as set out below. You may refuse, but the service cannot be provided without this consent.',
  s4ColItem: 'Item',
  s4ColDetail: 'Details',
  s4Receiver: 'Recipient',
  s4ReceiverVal: 'Anthropic, PBC',
  s4Country: 'Destination country',
  s4CountryVal: 'United States',
  s4Items: 'Data transferred',
  s4ItemsVal:
    'Resume text (after identifying information is removed), answer transcripts, analysis metrics',
  s4Purpose: 'Purpose',
  s4PurposeVal: 'Generating interview questions and writing feedback',
  s4Method: 'Method',
  s4MethodVal: 'Network transmission via API call (encrypted in transit)',
  s4Period: 'Retention',
  s4PeriodVal: 'Until the processing purpose is fulfilled',

  s5Title: '5. Use of artificial intelligence',
  s5Body1:
    'Interview questions and feedback are written by generative AI. Such output is labelled as AI generated.',
  s5Body2:
    'Analysis scores are reference indicators to support practice. They are not used for decisions affecting your rights or obligations, such as hiring outcomes. You may request an explanation of, or object to, any result.',

  s6Title: '6. Your rights and how to exercise them',
  s6Item1: 'Right of access — review your records in the service',
  s6Item2: 'Right to correction and deletion — delete individual sessions',
  s6Item3: 'Right to suspend processing and withdraw consent — close your account',
  s6Item4: 'You may also exercise these rights through the contact below',

  s7Title: '7. Security measures',
  s7Item1: 'Passwords stored with one-way encryption (bcrypt)',
  s7Item2:
    'Answer recordings stored encrypted (AES-256) — unreadable even if the storage media leaks',
  s7Item3: 'Login attempt limiting and access restriction',
  s7Item4: 'Automatic masking of identifying data in resumes before external transfer',
  s7Item5: 'Automatic destruction of expired data, beyond recovery',
  s7Item6: 'Access control limiting each user to their own data',
  s7Item7:
    'Access logs to the personal data processing system retained for two years and reviewed at least monthly',

  s8Title: '8. Data protection officer',
  s8ColType: 'Role',
  s8ColDetail: 'Details',
  s8Operator: 'Operator',
  s8Dpo: 'Protection officer',
  s8Contact: 'Contact',
  s8Note:
    'You may report or seek advice on privacy infringements at the Korea Internet & Security Agency report centre (privacy.kisa.or.kr, 118) or the Personal Information Protection Commission (privacy.go.kr).',

  s9Title: '9. Changes to this policy',
  s9Body:
    'Any change to this policy will be announced in the service at least 7 days before it takes effect. Changes that materially affect your rights will be announced 30 days in advance, and consent will be sought again where required.',
}
