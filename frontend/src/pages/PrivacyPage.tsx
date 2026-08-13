/**
 * 개인정보 처리방침 (개인정보 보호법 제30조).
 *
 * ⚠️ 게시 전 확인 필요: 아래 TODO 항목은 사업자만 확정할 수 있습니다.
 *    - 사업자명 / 대표자 / 사업자등록번호 / 주소
 *    - 개인정보 보호책임자 성명·직책·연락처
 *    변호사 검토 후 게시하시기 바랍니다.
 *
 * 보유기간·수집항목은 실제 코드 동작과 일치시켰습니다.
 * 변경 시 app/services/retention.py 및 동의 화면과 함께 수정해야 합니다.
 */
import { Link } from 'react-router-dom'

const EFFECTIVE_DATE = '2026년 8월 13일'
const OPERATOR = '[TODO: 사업자명]'
const DPO_NAME = '[TODO: 개인정보 보호책임자 성명]'
const DPO_CONTACT = '[TODO: 연락처 이메일]'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
        <Link to="/" className="text-sm text-blue-700 hover:underline">
          ← 홈으로
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-2">
          개인정보 처리방침
        </h1>
        <p className="text-sm text-slate-500 mb-8">시행일: {EFFECTIVE_DATE}</p>

        <div className="prose prose-slate prose-sm max-w-none space-y-8">
          <Section title="1. 처리하는 개인정보 항목">
            <Table
              head={['구분', '항목', '수집 방법']}
              rows={[
                ['필수', '이메일, 비밀번호(암호화 저장)', '회원가입 시 입력'],
                ['선택', '이름', '회원가입 시 입력'],
                ['필수', '이력서 텍스트 또는 PDF 파일', '면접 세션 생성 시 입력·업로드'],
                ['필수', '관심 직무', '면접 세션 생성 시 입력'],
                ['필수', '답변 녹화 영상(얼굴·음성 포함)', '면접 진행 중 녹화'],
                [
                  '자동생성',
                  '음성 전사문, 시선·자세·손 움직임 지표, 말 속도·피치 등 분석 결과',
                  '업로드된 영상 분석 과정에서 생성',
                ],
              ]}
            />
            <p className="text-xs text-slate-500 mt-2">
              이력서에 포함된 주민등록번호·전화번호·이메일·주소·생년월일은 외부 AI
              서비스로 전송되기 전에 자동으로 가려집니다.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              회원가입 시 만 14세 이상 여부를 확인하기 위해 생년월일을 입력받으나,{' '}
              <strong>확인 후 저장하지 않으며</strong> 확인을 마친 시각만 기록합니다.
            </p>
          </Section>

          <Section title="1-1. 만 14세 미만 아동의 개인정보">
            <p>
              본 서비스는 취업 준비를 지원하는 서비스로{' '}
              <strong>만 14세 미만 아동의 가입을 받지 않습니다.</strong> 회원가입 시
              연령을 확인하여 만 14세 미만인 경우 가입이 제한되며, 아동의 개인정보를
              수집·이용하지 않습니다.
            </p>
          </Section>

          <Section title="2. 개인정보의 처리 목적">
            <ul className="list-disc pl-5 space-y-1">
              <li>회원 식별 및 로그인 등 서비스 제공</li>
              <li>이력서·직무 기반 맞춤 면접 질문 생성</li>
              <li>답변 영상 분석을 통한 비언어·언어 표현 피드백 제공</li>
              <li>이용 이력 조회 및 회차 간 비교 기능 제공</li>
            </ul>
            <p className="mt-2">
              위 목적 이외의 용도로는 이용하지 않으며, 목적이 변경되는 경우 사전에
              동의를 받습니다.
            </p>
          </Section>

          <Section title="3. 개인정보의 보유 및 파기">
            <Table
              head={['데이터', '보유기간', '파기 방법']}
              rows={[
                ['답변 녹화 영상', '수집일로부터 30일', '자동 삭제(복구 불가)'],
                [
                  '분석 결과 및 전사문',
                  '수집일로부터 6개월',
                  '보유기간 경과 시 자동 삭제',
                ],
                ['계정 정보', '회원 탈퇴 시까지', '탈퇴 즉시 전부 삭제'],
              ]}
            />
            <p className="mt-2">
              보유기간이 지난 정보는 자동으로 파기되며, 회원 탈퇴 시 위 정보 전체가
              지체 없이 삭제됩니다.
            </p>
            <p className="mt-2">
              <strong>파기 방법</strong> — 전자적 파일은 복원이 불가능하도록 저장
              영역을 덮어쓴 후 삭제하며, 데이터베이스에서 삭제된 기록은 잔여 영역까지
              회수하여 복구할 수 없도록 처리합니다.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              단, 접속기록은 「개인정보의 안전성 확보조치 기준」 제8조에 따라 2년간
              별도 보관됩니다.
            </p>
          </Section>

          <Section title="4. 개인정보의 국외 이전">
            <p>
              면접 질문 생성 및 종합 피드백 작성을 위해 아래와 같이 개인정보를
              국외로 이전합니다. 이용자는 동의를 거부할 수 있으나, 동의하지 않는
              경우 서비스 이용이 제한됩니다.
            </p>
            <Table
              head={['항목', '내용']}
              rows={[
                ['이전받는 자', 'Anthropic, PBC'],
                ['이전 국가', '미국'],
                [
                  '이전 항목',
                  '이력서 텍스트(식별정보 제거 후), 답변 전사문, 분석 지표',
                ],
                ['이전 목적', '면접 질문 생성 및 피드백 작성'],
                ['이전 방법', 'API 호출을 통한 네트워크 전송(전송 구간 암호화)'],
                ['보유 기간', '처리 목적 달성 시까지'],
              ]}
            />
          </Section>

          <Section title="5. 인공지능 기술의 이용">
            <p>
              본 서비스는 면접 질문과 피드백을 생성형 인공지능으로 작성합니다. 해당
              결과물에는 AI가 생성했다는 표시가 함께 제공됩니다.
            </p>
            <p>
              분석 점수는 <strong>연습을 돕기 위한 참고 지표</strong>이며, 채용 여부
              등 이용자의 권리·의무에 영향을 미치는 결정에 사용되지 않습니다. 결과에
              대해 설명을 요구하거나 이의를 제기하실 수 있습니다.
            </p>
          </Section>

          <Section title="6. 정보주체의 권리와 행사 방법">
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보 열람 요구 — 서비스 내 이용 기록 화면에서 확인</li>
              <li>정정·삭제 요구 — 개별 세션 삭제 기능 제공</li>
              <li>처리정지 및 동의 철회 — 회원 탈퇴로 전체 삭제 가능</li>
              <li>위 권리 행사는 아래 연락처를 통해서도 요청하실 수 있습니다</li>
            </ul>
          </Section>

          <Section title="7. 개인정보의 안전성 확보 조치">
            <ul className="list-disc pl-5 space-y-1">
              <li>비밀번호 일방향 암호화 저장(bcrypt)</li>
              <li>
                <strong>답변 녹화 영상 암호화 저장(AES-256)</strong> — 저장 매체가
                유출되더라도 내용을 열람할 수 없습니다
              </li>
              <li>로그인 시도 횟수 제한 및 접근 제한</li>
              <li>외부 전송 전 이력서 내 식별정보 자동 마스킹</li>
              <li>보유기간 경과 데이터 자동 파기(복원 불가 방식)</li>
              <li>본인 데이터에만 접근 가능하도록 하는 접근 통제</li>
              <li>개인정보처리시스템 접속기록 2년간 보관 및 월 1회 이상 점검</li>
            </ul>
          </Section>

          <Section title="8. 개인정보 보호책임자">
            <Table
              head={['구분', '내용']}
              rows={[
                ['운영자', OPERATOR],
                ['보호책임자', DPO_NAME],
                ['연락처', DPO_CONTACT],
              ]}
            />
            <p className="mt-2 text-xs text-slate-500">
              개인정보 침해에 대한 신고·상담은 개인정보침해신고센터(privacy.kisa.or.kr,
              국번없이 118) 또는 개인정보보호위원회(privacy.go.kr)로 문의하실 수
              있습니다.
            </p>
          </Section>

          <Section title="9. 처리방침의 변경">
            <p>
              본 처리방침이 변경되는 경우 변경 사항을 시행 7일 전부터 서비스 내에
              공지합니다. 다만 이용자 권리에 중대한 영향을 미치는 변경은 30일 전에
              공지하고 필요한 경우 동의를 다시 받습니다.
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-slate-900 mb-2">{title}</h2>
      <div className="text-sm text-slate-700 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg mt-2">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2 font-semibold text-slate-600 text-xs"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-100">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-slate-700 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
