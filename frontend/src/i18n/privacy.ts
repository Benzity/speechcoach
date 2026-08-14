// 개인정보 처리방침 (개인정보 보호법 제30조).
// 보유기간·수집항목은 실제 코드 동작과 일치해야 한다.
// 변경 시 backend/app/services/retention.py 및 동의 화면(auth.ts)도 함께 수정할 것.
//
// 조 번호는 법 제30조 제1항의 기재사항 순서를 따른다. 항목을 추가·삭제하면
// PrivacyPage.tsx의 렌더 순서도 함께 맞출 것.
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
    '보유기간 경과·처리 목적 달성 등 파기 사유가 발생하면 지체 없이(5일 이내) 파기하며, 회원 탈퇴 시 위 정보 전체가 지체 없이 삭제됩니다.',
  s3Destroy:
    '파기 방법 — 전자적 파일은 복원이 불가능하도록 저장 영역을 덮어쓴 후 삭제하며, 데이터베이스에서 삭제된 기록은 잔여 영역까지 회수하여 복구할 수 없도록 처리합니다.',
  s3AccessLog:
    '단, 접속기록은 「개인정보의 안전성 확보조치 기준」 제8조에 따라 2년간 별도 보관됩니다.',

  // 4. 제3자 제공
  s4Title: '4. 개인정보의 제3자 제공',
  s4Body:
    '본 서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 향후 제공이 필요해지는 경우 제공받는 자·목적·항목·보유기간을 알리고 별도로 동의를 받으며, 동의 없이 제공하지 않습니다.',
  s4Exception:
    '다만 법령에 특별한 규정이 있거나 수사기관이 법률에 정한 절차와 방법에 따라 요구하는 경우에는 「개인정보 보호법」 제18조 제2항에 따라 제공할 수 있습니다.',

  // 5. 처리 위탁
  s5Title: '5. 개인정보 처리업무의 위탁',
  s5Intro:
    '원활한 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 위탁하고 있습니다. 위탁계약 시 「개인정보 보호법」 제26조에 따라 목적 외 처리 금지, 안전성 확보조치, 재위탁 제한, 손해배상 등의 책임에 관한 사항을 문서에 명시합니다.',
  s5ColTrustee: '수탁자',
  s5ColWork: '위탁업무 내용',
  s5NgrokName: 'ngrok Inc. (미국)',
  // 보관·삭제에 관한 기술은 수탁자의 데이터 처리 계약(DPA)에 근거한 것만 쓴다.
  // 확인되지 않은 사실을 단정하면 처리방침이 허위 기재가 된다.
  s5NgrokWork:
    '서비스 접속 경로 제공(보안 터널링) — 이용자 브라우저와 분석 서버 사이의 통신을 중계합니다. 위탁계약(DPA)에 따라 목적 외 처리가 금지되며, 계약 종료 또는 요청 시 데이터가 삭제됩니다.',
  s5Note:
    '위탁업무의 내용이나 수탁자가 변경될 경우 본 처리방침을 통해 지체 없이 공개합니다. 수탁자가 국외에 있으므로 자세한 사항은 아래 6항을 함께 확인해 주세요.',

  // 6. 국외 이전
  s6Title: '6. 개인정보의 국외 이전',
  s6Intro:
    '본 서비스는 아래와 같이 개인정보를 국외로 이전합니다. 「개인정보 보호법」 제28조의8 제2항에 따라 이전에 관한 사항을 알려드립니다.',
  s6ColItem: '구분',
  s6ColDetail: '내용',
  s6LblBasis: '법적 근거',
  s6LblReceiver: '이전받는 자',
  s6LblCountry: '이전 국가',
  s6LblContact: '이전받는 자의 연락처',
  s6LblItems: '이전 항목',
  s6LblWhen: '이전 시기 및 방법',
  s6LblPurpose: '이전받는 자의 이용 목적',
  s6LblPeriod: '이전받는 자의 보유·이용 기간',
  s6LblRefuse: '이전을 거부하는 방법·절차 및 거부의 효과',

  s6aCaption: '가) 면접 질문·피드백 생성',
  s6aBasis: '정보주체의 동의 (제28조의8 제1항 제1호)',
  s6aReceiver: 'Anthropic, PBC',
  s6aCountry: '미국',
  s6aContact: 'privacy@anthropic.com',
  s6aItems: '이력서 텍스트(식별정보 마스킹 후), 답변 전사문, 분석 지표',
  s6aWhen:
    '면접 세션 시작 시(질문 생성) 및 세션 종료 시(종합 피드백) 각 1회 · API 호출을 통한 네트워크 전송(전송 구간 암호화)',
  s6aPurpose: '면접 질문 생성 및 피드백 작성',
  s6aPeriod:
    '이전받는 자의 정책에 따라 수신·생성 시점부터 최대 30일 보관 후 자동 삭제됩니다. 다만 안전 점검 시스템에 의해 표시되거나 법령상 보존 의무가 있는 경우 더 오래 보관될 수 있습니다. 이전받는 자는 자사 정책상 전송된 내용을 별도 동의 없이 AI 모델 학습에 이용하지 않는다고 밝히고 있으며, 본 서비스는 해당 동의를 제공하지 않습니다.',
  s6aRefuse:
    '회원가입 시 국외 이전 동의를 거부하시면 이전이 이루어지지 않습니다. 가입 후에는 회원 탈퇴를 통해 동의를 철회할 수 있습니다. 다만 질문 생성과 피드백이 해당 서비스에 의존하므로, 거부·철회 시 서비스를 이용하실 수 없습니다.',

  s6bCaption: '나) 서비스 접속 경로 제공',
  s6bBasis:
    '계약의 이행에 필요한 처리위탁으로서 본 처리방침에 공개 (제28조의8 제1항 제3호)',
  s6bReceiver: 'ngrok Inc.',
  s6bCountry: '미국',
  s6bContact: 'privacy@ngrok.com',
  s6bItems:
    '서비스 이용 과정에서 오가는 통신 내용 전부(이력서, 답변 녹화 영상, 분석 결과, 접속 IP)',
  s6bWhen: '서비스 이용 시 상시 · 암호화된 통신 구간의 중계',
  s6bPurpose: '이용자 브라우저와 분석 서버 사이의 통신 중계',
  s6bPeriod:
    '이전받는 자와 체결된 데이터 처리 계약(DPA)에 따라 서비스 제공에 필요한 기간 동안 처리되며, 계약이 종료되거나 본 서비스가 요청하는 경우 삭제됩니다.',
  s6bRefuse:
    '접속 경로 자체에 해당하므로 이전을 거부하시면 서비스에 접속하실 수 없습니다. 거부를 원하시는 경우 아래 11항의 연락처로 요청해 주시기 바라며, 서비스 이용 중단 외의 대안은 제공되지 않습니다.',

  // 7. 자동 수집
  s7Title: '7. 자동으로 수집되는 정보와 거부 방법',
  s7Intro:
    '서비스 이용 과정에서 아래 정보가 자동으로 생성·수집됩니다. 「개인정보 보호법」 제30조 제1항 제7호에 따라 그 내용과 거부 방법을 안내합니다.',
  s7ColItem: '항목',
  s7ColPurpose: '수집 목적',
  s7ColRefuse: '거부 방법',
  s7TokenItem: '로그인 토큰 (브라우저 로컬 저장소)',
  s7TokenPurpose: '로그인 상태 유지',
  s7TokenRefuse: '로그아웃 시 즉시 삭제되며, 브라우저의 사이트 데이터 삭제로도 제거할 수 있습니다',
  s7LocaleItem: '언어 설정 (브라우저 로컬 저장소)',
  s7LocalePurpose: '선택한 표시 언어 유지',
  s7LocaleRefuse: '브라우저의 사이트 데이터 삭제로 제거할 수 있습니다',
  s7LogItem: '접속기록 (접속 일시, 접속지 IP, 요청 경로, 처리 결과)',
  s7LogPurpose: '부정 접근 탐지 및 법령상 접속기록 보관 의무 이행',
  s7LogRefuse:
    '「개인정보의 안전성 확보조치 기준」 제8조에 따른 법정 의무이므로 거부하실 수 없습니다',
  s7NoteNoCookie:
    '본 서비스는 쿠키, 광고식별자(ADID·IDFA), 행태정보를 수집하지 않으며 맞춤형 광고를 제공하지 않습니다. 제3자 분석 도구나 광고 스크립트도 사용하지 않습니다.',
  s7NoteHow:
    '브라우저 저장소 삭제 경로 — Chrome: 설정 > 개인정보 보호 및 보안 > 인터넷 사용 기록 삭제 / Edge: 설정 > 쿠키 및 사이트 권한 > 쿠키 및 사이트 데이터 관리 및 삭제 / Safari: 환경설정 > 개인정보 보호 > 웹사이트 데이터 관리. 로그인 토큰을 삭제하면 로그아웃됩니다.',

  // 8. AI
  s8Title: '8. 인공지능 기술의 이용',
  s8Body1:
    '본 서비스는 면접 질문과 피드백을 생성형 인공지능으로 작성합니다. 해당 결과물에는 AI가 생성했다는 표시가 함께 제공됩니다.',
  s8Body2:
    '분석 점수는 연습을 돕기 위한 참고 지표이며, 채용 여부 등 이용자의 권리·의무에 영향을 미치는 결정에 사용되지 않습니다. 결과에 대해 설명을 요구하거나 이의를 제기하실 수 있습니다.',

  // 9. 권리
  s9Title: '9. 정보주체의 권리와 행사 방법',
  s9Item1: '개인정보 열람 요구 — 서비스 내 이용 기록 화면에서 확인',
  s9Item2: '정정·삭제 요구 — 개별 세션 삭제 기능 제공',
  s9Item3: '처리정지 및 동의 철회 — 회원 탈퇴로 전체 삭제 가능',
  s9Item4: '위 권리 행사는 아래 11항의 연락처를 통해 서면·이메일로도 요청하실 수 있습니다',
  s9Period:
    '열람·정정·삭제·처리정지 요구는 접수일로부터 10일 이내에 처리하고 그 결과를 알려드립니다. 정정·삭제 요구를 받은 경우 완료할 때까지 해당 개인정보를 이용하거나 제공하지 않습니다.',
  s9Refusal:
    '「개인정보 보호법」 제20조 제4항 등에 근거하여 요구를 거부하는 경우에는 요구를 받은 날부터 10일 이내에 거부의 근거와 사유, 이의제기 방법을 알려드립니다.',
  s9Agent:
    '법정대리인이나 위임을 받은 대리인을 통해서도 권리를 행사하실 수 있습니다. 이 경우 「개인정보 처리 방법에 관한 고시」 별지 제11호 서식에 따른 위임장을 제출해야 하며, 정당한 대리인인지 확인합니다.',

  // 10. 안전성 확보조치
  s10Title: '10. 개인정보의 안전성 확보 조치',
  s10Item1: '비밀번호 일방향 암호화 저장(bcrypt)',
  s10Item2:
    '답변 녹화 영상 암호화 저장(AES-256) — 저장 매체가 유출되더라도 내용을 열람할 수 없습니다',
  s10Item3: '로그인 시도 횟수 제한 및 접근 제한',
  s10Item4: '외부 전송 전 이력서 내 식별정보 자동 마스킹',
  s10Item5: '보유기간 경과 데이터 자동 파기(복원 불가 방식)',
  s10Item6: '본인 데이터에만 접근 가능하도록 하는 접근 통제',
  s10Item7: '개인정보처리시스템 접속기록 2년간 보관 및 월 1회 이상 점검',

  // 11. 보호책임자
  s11Title: '11. 개인정보 보호책임자 및 고충처리',
  s11ColType: '구분',
  s11ColDetail: '내용',
  s11Operator: '운영자',
  s11Dpo: '보호책임자',
  s11Contact: '연락처',
  s11Note:
    '개인정보 처리에 관한 문의, 불만처리, 피해구제는 위 연락처로 접수해 주세요. 접수 후 지체 없이 답변드립니다.',
  s11ReliefTitle: '권익침해 구제방법',
  s11ReliefIntro:
    '아래 기관은 본 서비스와 별개의 기관으로, 자체적인 불만처리·피해구제 결과에 만족하지 못하시거나 더 자세한 도움이 필요하시면 문의하실 수 있습니다.',
  s11ColOrg: '기관',
  s11ColPhone: '연락처',
  s11ColSite: '사이트',
  s11Kisa: '개인정보침해 신고센터',
  s11KisaPhone: '(국번없이) 118',
  s11Kopico: '개인정보 분쟁조정위원회',
  s11KopicoPhone: '1833-6972',
  s11Spo: '대검찰청 사이버수사과',
  s11SpoPhone: '(국번없이) 1301',
  s11Police: '경찰청 사이버수사국',
  s11PolicePhone: '(국번없이) 182',

  // 12. 변경
  s12Title: '12. 처리방침의 변경',
  s12Body:
    '본 처리방침이 변경되는 경우 변경 사항을 시행 7일 전부터 서비스 내에 공지합니다. 다만 이용자 권리에 중대한 영향을 미치는 변경은 30일 전에 공지하고 필요한 경우 동의를 다시 받습니다.',
  s12HistoryTitle: '개정 이력',
  s12ColVersion: '버전',
  s12ColDate: '시행일',
  s12ColChange: '주요 변경 내용',
  s12V2: '2026-08-14',
  s12V2Change:
    '제3자 제공·처리위탁 항목 신설, 국외 이전에 연락처·이전 시기·거부 절차 추가, 자동 수집 정보와 거부 방법 항목 신설, 권리 행사 절차·기한 및 권익침해 구제기관 보완',
  s12V1: '2026-08-13',
  s12V1Change: '최초 제정',
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
    'Once a ground for destruction arises — the retention period ends or the purpose is fulfilled — data is destroyed without delay (within 5 days), and everything above is deleted without delay when you close your account.',
  s3Destroy:
    'Method — electronic files are overwritten before deletion so they cannot be restored, and records removed from the database are cleared down to the residual storage area.',
  s3AccessLog:
    'Access logs are retained separately for two years under Article 8 of the Standards for Ensuring the Safety of Personal Information.',

  s4Title: '4. Provision to third parties',
  s4Body:
    'We do not provide your personal data to third parties. Should provision become necessary, we will identify the recipient, purpose, data and retention period and obtain separate consent; nothing is provided without it.',
  s4Exception:
    'Data may nonetheless be provided where a statute expressly requires it, or where an investigative authority requests it through the procedure and method prescribed by law, under Article 18(2) of the Personal Information Protection Act.',

  s5Title: '5. Outsourcing of processing',
  s5Intro:
    'We outsource the processing work below to deliver the service. Under Article 26 of the Personal Information Protection Act, our contracts set out the prohibition on processing beyond the stated purpose, security measures, restrictions on sub-contracting, and liability for damages.',
  s5ColTrustee: 'Processor',
  s5ColWork: 'Work outsourced',
  s5NgrokName: 'ngrok Inc. (United States)',
  s5NgrokWork:
    'Providing the service access path (secure tunnelling) — relays traffic between your browser and the analysis server. Under the data processing addendum, processing beyond that purpose is prohibited and data is deleted on termination or on request.',
  s5Note:
    'Any change to the outsourced work or the processor will be disclosed in this policy without delay. The processor is located overseas, so please also see section 6 below.',

  s6Title: '6. Transfer of personal data overseas',
  s6Intro:
    'We transfer personal data overseas as set out below. This notice is given under Article 28-8(2) of the Personal Information Protection Act.',
  s6ColItem: 'Item',
  s6ColDetail: 'Details',
  s6LblBasis: 'Legal basis',
  s6LblReceiver: 'Recipient',
  s6LblCountry: 'Destination country',
  s6LblContact: 'Recipient contact',
  s6LblItems: 'Data transferred',
  s6LblWhen: 'Timing and method',
  s6LblPurpose: "Recipient's purpose",
  s6LblPeriod: "Recipient's retention and use period",
  s6LblRefuse: 'How to refuse, and what refusing means',

  s6aCaption: 'a) Generating interview questions and feedback',
  s6aBasis: 'Your consent (Article 28-8(1)1)',
  s6aReceiver: 'Anthropic, PBC',
  s6aCountry: 'United States',
  s6aContact: 'privacy@anthropic.com',
  s6aItems:
    'Resume text (after identifying information is masked), answer transcripts, analysis metrics',
  s6aWhen:
    'Once when a session starts (question generation) and once when it ends (overall feedback) · Transmitted via API over an encrypted connection',
  s6aPurpose: 'Generating interview questions and writing feedback',
  s6aPeriod:
    "Per the recipient's policy, data is deleted automatically within 30 days of receipt or generation. It may be kept longer where flagged by automated safety systems or where retention is legally required. The recipient states that it does not use transferred content to train AI models without express permission, and this service does not give that permission.",
  s6aRefuse:
    'Declining the overseas transfer consent at sign-up prevents any transfer. After sign-up you may withdraw consent by closing your account. Question and feedback generation depends on this service, so refusing or withdrawing means you cannot use it.',

  s6bCaption: 'b) Providing the service access path',
  s6bBasis:
    'Outsourced processing necessary to perform our contract with you, disclosed in this policy (Article 28-8(1)3)',
  s6bReceiver: 'ngrok Inc.',
  s6bCountry: 'United States',
  s6bContact: 'privacy@ngrok.com',
  s6bItems:
    'All traffic exchanged while using the service (resume, answer recordings, analysis results, access IP)',
  s6bWhen: 'Continuously while you use the service · Relay of an encrypted connection',
  s6bPurpose: 'Relaying traffic between your browser and the analysis server',
  s6bPeriod:
    "Processed for as long as needed to provide the service under the data processing addendum agreed with the recipient, and deleted on termination of that agreement or at this service's request.",
  s6bRefuse:
    'This is the access path itself, so refusing means you cannot reach the service. If you wish to refuse, contact us using section 11 below; no alternative other than discontinuing use is available.',

  s7Title: '7. Data collected automatically, and how to refuse it',
  s7Intro:
    'The data below is generated and collected automatically as you use the service. This notice is given under Article 30(1)7 of the Personal Information Protection Act.',
  s7ColItem: 'Data',
  s7ColPurpose: 'Purpose',
  s7ColRefuse: 'How to refuse',
  s7TokenItem: 'Login token (browser local storage)',
  s7TokenPurpose: 'Keeping you signed in',
  s7TokenRefuse: 'Removed the moment you log out, and by clearing site data in your browser',
  s7LocaleItem: 'Language preference (browser local storage)',
  s7LocalePurpose: 'Remembering your chosen display language',
  s7LocaleRefuse: 'Removed by clearing site data in your browser',
  s7LogItem: 'Access log (timestamp, source IP, request path, result)',
  s7LogPurpose: 'Detecting unauthorised access and meeting the statutory access-log duty',
  s7LogRefuse:
    'Cannot be refused — it is required by Article 8 of the Standards for Ensuring the Safety of Personal Information',
  s7NoteNoCookie:
    'We do not use cookies, advertising identifiers (ADID/IDFA) or behavioural data, and we do not serve targeted advertising. No third-party analytics or advertising scripts are used.',
  s7NoteHow:
    'Clearing browser storage — Chrome: Settings > Privacy and security > Delete browsing data / Edge: Settings > Cookies and site permissions > Manage and delete cookies and site data / Safari: Settings > Privacy > Manage Website Data. Deleting the login token logs you out.',

  s8Title: '8. Use of artificial intelligence',
  s8Body1:
    'Interview questions and feedback are written by generative AI. Such output is labelled as AI generated.',
  s8Body2:
    'Analysis scores are reference indicators to support practice. They are not used for decisions affecting your rights or obligations, such as hiring outcomes. You may request an explanation of, or object to, any result.',

  s9Title: '9. Your rights and how to exercise them',
  s9Item1: 'Right of access — review your records in the service',
  s9Item2: 'Right to correction and deletion — delete individual sessions',
  s9Item3: 'Right to suspend processing and withdraw consent — close your account',
  s9Item4:
    'You may also make these requests in writing or by email using the contact in section 11 below',
  s9Period:
    'Requests to access, correct, delete or suspend processing are handled within 10 days of receipt and the outcome is communicated to you. Once a correction or deletion request is received, the data is neither used nor provided until the request is completed.',
  s9Refusal:
    'Where a request is refused on grounds such as Article 20(4) of the Personal Information Protection Act, we will tell you the basis and reason for the refusal, and how to object, within 10 days of receiving it.',
  s9Agent:
    'You may also act through a legal representative or an authorised agent. In that case a power of attorney in the form prescribed by Annex 11 of the Notice on Methods of Processing Personal Information must be submitted, and we verify that the agent is duly authorised.',

  s10Title: '10. Security measures',
  s10Item1: 'Passwords stored with one-way encryption (bcrypt)',
  s10Item2:
    'Answer recordings stored encrypted (AES-256) — unreadable even if the storage media leaks',
  s10Item3: 'Login attempt limiting and access restriction',
  s10Item4: 'Automatic masking of identifying data in resumes before external transfer',
  s10Item5: 'Automatic destruction of expired data, beyond recovery',
  s10Item6: 'Access control limiting each user to their own data',
  s10Item7:
    'Access logs to the personal data processing system retained for two years and reviewed at least monthly',

  s11Title: '11. Data protection officer and complaints',
  s11ColType: 'Role',
  s11ColDetail: 'Details',
  s11Operator: 'Operator',
  s11Dpo: 'Protection officer',
  s11Contact: 'Contact',
  s11Note:
    'Please direct enquiries, complaints and remedy requests about the handling of personal data to the contact above. We respond without delay.',
  s11ReliefTitle: 'Dispute resolution and remedies',
  s11ReliefIntro:
    'The bodies below are independent of this service. You may contact them if you are not satisfied with our own handling of a complaint or need further help.',
  s11ColOrg: 'Body',
  s11ColPhone: 'Phone',
  s11ColSite: 'Website',
  s11Kisa: 'Privacy Infringement Report Centre',
  s11KisaPhone: '118',
  s11Kopico: 'Personal Information Dispute Mediation Committee',
  s11KopicoPhone: '1833-6972',
  s11Spo: 'Supreme Prosecutors’ Office Cyber Investigation Division',
  s11SpoPhone: '1301',
  s11Police: 'National Police Agency Cyber Bureau',
  s11PolicePhone: '182',

  s12Title: '12. Changes to this policy',
  s12Body:
    'Any change to this policy will be announced in the service at least 7 days before it takes effect. Changes that materially affect your rights will be announced 30 days in advance, and consent will be sought again where required.',
  s12HistoryTitle: 'Revision history',
  s12ColVersion: 'Version',
  s12ColDate: 'Effective',
  s12ColChange: 'Summary of changes',
  s12V2: '2026-08-14',
  s12V2Change:
    'Added sections on third-party provision and outsourcing; added recipient contact, transfer timing and refusal procedure to the overseas transfer section; added a section on automatically collected data and how to refuse it; expanded the procedure and deadlines for exercising rights and the list of remedy bodies',
  s12V1: '2026-08-13',
  s12V1Change: 'First issued',
}
