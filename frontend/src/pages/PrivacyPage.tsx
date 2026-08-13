/**
 * 개인정보 처리방침 (개인정보 보호법 제30조).
 *
 * ⚠️ 게시 전 확인 필요: 아래 TODO 항목은 사업자만 확정할 수 있습니다.
 *    - 사업자명 / 대표자 / 사업자등록번호 / 주소
 *    - 개인정보 보호책임자 성명·직책·연락처
 *    변호사 검토 후 게시하시기 바랍니다.
 *
 * 문구는 i18n/privacy.ts에 있습니다. 보유기간·수집항목은 실제 코드 동작과
 * 일치시켰으므로, 변경 시 backend/app/services/retention.py 및 동의 화면
 * (i18n/auth.ts)과 함께 수정해야 합니다.
 */
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

const EFFECTIVE_DATE = '2026-08-13'
const OPERATOR = '[TODO: 사업자명]'
const DPO_NAME = '[TODO: 개인정보 보호책임자 성명]'
const DPO_CONTACT = '[TODO: 연락처 이메일]'

export default function PrivacyPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
        <Link to="/" className="text-sm text-blue-700 hover:underline">
          {t('privacy.backHome')}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-2">
          {t('privacy.title')}
        </h1>
        <p className="text-sm text-slate-500 mb-8">
          {t('privacy.effective', { date: EFFECTIVE_DATE })}
        </p>

        <div className="prose prose-slate prose-sm max-w-none space-y-8">
          <Section title={t('privacy.s1Title')}>
            <Table
              head={[
                t('privacy.s1ColType'),
                t('privacy.s1ColItem'),
                t('privacy.s1ColMethod'),
              ]}
              rows={[
                [
                  t('privacy.s1Required'),
                  t('privacy.s1ItemAccount'),
                  t('privacy.s1MethodSignup'),
                ],
                [
                  t('privacy.s1Optional'),
                  t('privacy.s1ItemName'),
                  t('privacy.s1MethodSignup'),
                ],
                [
                  t('privacy.s1Required'),
                  t('privacy.s1ItemResume'),
                  t('privacy.s1MethodSession'),
                ],
                [
                  t('privacy.s1Required'),
                  t('privacy.s1ItemJob'),
                  t('privacy.s1MethodSessionInput'),
                ],
                [
                  t('privacy.s1Required'),
                  t('privacy.s1ItemVideo'),
                  t('privacy.s1MethodRecord'),
                ],
                [
                  t('privacy.s1Auto'),
                  t('privacy.s1ItemAnalysis'),
                  t('privacy.s1MethodAnalysis'),
                ],
              ]}
            />
            <p className="text-xs text-slate-500 mt-2">{t('privacy.s1NoteMasking')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('privacy.s1NoteBirth')}</p>
          </Section>

          <Section title={t('privacy.s1aTitle')}>
            <p>{t('privacy.s1aBody')}</p>
          </Section>

          <Section title={t('privacy.s2Title')}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('privacy.s2Item1')}</li>
              <li>{t('privacy.s2Item2')}</li>
              <li>{t('privacy.s2Item3')}</li>
              <li>{t('privacy.s2Item4')}</li>
            </ul>
            <p className="mt-2">{t('privacy.s2Note')}</p>
          </Section>

          <Section title={t('privacy.s3Title')}>
            <Table
              head={[
                t('privacy.s3ColData'),
                t('privacy.s3ColPeriod'),
                t('privacy.s3ColMethod'),
              ]}
              rows={[
                [
                  t('privacy.s3Video'),
                  t('privacy.s3VideoPeriod'),
                  t('privacy.s3VideoMethod'),
                ],
                [
                  t('privacy.s3Analysis'),
                  t('privacy.s3AnalysisPeriod'),
                  t('privacy.s3AnalysisMethod'),
                ],
                [
                  t('privacy.s3Account'),
                  t('privacy.s3AccountPeriod'),
                  t('privacy.s3AccountMethod'),
                ],
              ]}
            />
            <p className="mt-2">{t('privacy.s3Note')}</p>
            <p className="mt-2">{t('privacy.s3Destroy')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('privacy.s3AccessLog')}</p>
          </Section>

          <Section title={t('privacy.s4Title')}>
            <p>{t('privacy.s4Intro')}</p>
            <Table
              head={[t('privacy.s4ColItem'), t('privacy.s4ColDetail')]}
              rows={[
                [t('privacy.s4Receiver'), t('privacy.s4ReceiverVal')],
                [t('privacy.s4Country'), t('privacy.s4CountryVal')],
                [t('privacy.s4Items'), t('privacy.s4ItemsVal')],
                [t('privacy.s4Purpose'), t('privacy.s4PurposeVal')],
                [t('privacy.s4Method'), t('privacy.s4MethodVal')],
                [t('privacy.s4Period'), t('privacy.s4PeriodVal')],
              ]}
            />
          </Section>

          <Section title={t('privacy.s5Title')}>
            <p>{t('privacy.s5Body1')}</p>
            <p>{t('privacy.s5Body2')}</p>
          </Section>

          <Section title={t('privacy.s6Title')}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('privacy.s6Item1')}</li>
              <li>{t('privacy.s6Item2')}</li>
              <li>{t('privacy.s6Item3')}</li>
              <li>{t('privacy.s6Item4')}</li>
            </ul>
          </Section>

          <Section title={t('privacy.s7Title')}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('privacy.s7Item1')}</li>
              <li>{t('privacy.s7Item2')}</li>
              <li>{t('privacy.s7Item3')}</li>
              <li>{t('privacy.s7Item4')}</li>
              <li>{t('privacy.s7Item5')}</li>
              <li>{t('privacy.s7Item6')}</li>
              <li>{t('privacy.s7Item7')}</li>
            </ul>
          </Section>

          <Section title={t('privacy.s8Title')}>
            <Table
              head={[t('privacy.s8ColType'), t('privacy.s8ColDetail')]}
              rows={[
                [t('privacy.s8Operator'), OPERATOR],
                [t('privacy.s8Dpo'), DPO_NAME],
                [t('privacy.s8Contact'), DPO_CONTACT],
              ]}
            />
            <p className="mt-2 text-xs text-slate-500">{t('privacy.s8Note')}</p>
          </Section>

          <Section title={t('privacy.s9Title')}>
            <p>{t('privacy.s9Body')}</p>
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
