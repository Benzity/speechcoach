/**
 * 개인정보 처리방침 (개인정보 보호법 제30조).
 *
 * 조 번호는 법 제30조 제1항의 기재사항 순서를 따릅니다. 문구는
 * i18n/privacy.ts에 있고, 보유기간·수집항목은 실제 코드 동작과
 * 일치시켰으므로 변경 시 backend/app/services/retention.py 및 동의 화면
 * (i18n/auth.ts)과 함께 수정해야 합니다.
 *
 * ⚠️ 법인 설립 시 갱신 필요: 사업자명 / 대표자 / 사업자등록번호 / 주소 /
 *    보호책임자 직책·부서. 정식 서비스 개시 전 변호사 검토를 권합니다.
 */
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'

// 변경 시 i18n/privacy.ts의 개정 이력(s12V*)에 한 줄 추가할 것.
const EFFECTIVE_DATE = '2026-08-14'

// 법 제31조·시행령 제31조 제3항 — 성명·부서·연락처 공개 의무.
// 창업 준비 단계라 부서·직책이 없어 성명과 연락처만 공개한다.
// 법인 설립 후에는 사업자명·주소·직책을 갱신할 것.
const OPERATOR = 'SpeechCoachAI'
const DPO_NAME = '도승민'
const DPO_CONTACT = 'rrvat1016@cau.ac.kr'

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
            <p>{t('privacy.s4Body')}</p>
            <p className="text-xs text-slate-500">{t('privacy.s4Exception')}</p>
          </Section>

          <Section title={t('privacy.s5Title')}>
            <p>{t('privacy.s5Intro')}</p>
            <Table
              head={[t('privacy.s5ColTrustee'), t('privacy.s5ColWork')]}
              rows={[[t('privacy.s5NgrokName'), t('privacy.s5NgrokWork')]]}
            />
            <p className="text-xs text-slate-500 mt-2">{t('privacy.s5Note')}</p>
          </Section>

          <Section title={t('privacy.s6Title')}>
            <p>{t('privacy.s6Intro')}</p>

            <p className="font-semibold text-slate-800 mt-3">{t('privacy.s6aCaption')}</p>
            <Table
              head={[t('privacy.s6ColItem'), t('privacy.s6ColDetail')]}
              rows={[
                [t('privacy.s6LblBasis'), t('privacy.s6aBasis')],
                [t('privacy.s6LblReceiver'), t('privacy.s6aReceiver')],
                [t('privacy.s6LblCountry'), t('privacy.s6aCountry')],
                [t('privacy.s6LblContact'), t('privacy.s6aContact')],
                [t('privacy.s6LblItems'), t('privacy.s6aItems')],
                [t('privacy.s6LblWhen'), t('privacy.s6aWhen')],
                [t('privacy.s6LblPurpose'), t('privacy.s6aPurpose')],
                [t('privacy.s6LblPeriod'), t('privacy.s6aPeriod')],
                [t('privacy.s6LblRefuse'), t('privacy.s6aRefuse')],
              ]}
            />

            <p className="font-semibold text-slate-800 mt-4">{t('privacy.s6bCaption')}</p>
            <Table
              head={[t('privacy.s6ColItem'), t('privacy.s6ColDetail')]}
              rows={[
                [t('privacy.s6LblBasis'), t('privacy.s6bBasis')],
                [t('privacy.s6LblReceiver'), t('privacy.s6bReceiver')],
                [t('privacy.s6LblCountry'), t('privacy.s6bCountry')],
                [t('privacy.s6LblContact'), t('privacy.s6bContact')],
                [t('privacy.s6LblItems'), t('privacy.s6bItems')],
                [t('privacy.s6LblWhen'), t('privacy.s6bWhen')],
                [t('privacy.s6LblPurpose'), t('privacy.s6bPurpose')],
                [t('privacy.s6LblPeriod'), t('privacy.s6bPeriod')],
                [t('privacy.s6LblRefuse'), t('privacy.s6bRefuse')],
              ]}
            />
          </Section>

          <Section title={t('privacy.s7Title')}>
            <p>{t('privacy.s7Intro')}</p>
            <Table
              head={[
                t('privacy.s7ColItem'),
                t('privacy.s7ColPurpose'),
                t('privacy.s7ColRefuse'),
              ]}
              rows={[
                [
                  t('privacy.s7TokenItem'),
                  t('privacy.s7TokenPurpose'),
                  t('privacy.s7TokenRefuse'),
                ],
                [
                  t('privacy.s7LocaleItem'),
                  t('privacy.s7LocalePurpose'),
                  t('privacy.s7LocaleRefuse'),
                ],
                [t('privacy.s7LogItem'), t('privacy.s7LogPurpose'), t('privacy.s7LogRefuse')],
              ]}
            />
            <p className="mt-2">{t('privacy.s7NoteNoCookie')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('privacy.s7NoteHow')}</p>
          </Section>

          <Section title={t('privacy.s8Title')}>
            <p>{t('privacy.s8Body1')}</p>
            <p>{t('privacy.s8Body2')}</p>
          </Section>

          <Section title={t('privacy.s9Title')}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('privacy.s9Item1')}</li>
              <li>{t('privacy.s9Item2')}</li>
              <li>{t('privacy.s9Item3')}</li>
              <li>{t('privacy.s9Item4')}</li>
            </ul>
            <p className="mt-2">{t('privacy.s9Period')}</p>
            <p>{t('privacy.s9Refusal')}</p>
            <p className="text-xs text-slate-500">{t('privacy.s9Agent')}</p>
          </Section>

          <Section title={t('privacy.s10Title')}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t('privacy.s10Item1')}</li>
              <li>{t('privacy.s10Item2')}</li>
              <li>{t('privacy.s10Item3')}</li>
              <li>{t('privacy.s10Item4')}</li>
              <li>{t('privacy.s10Item5')}</li>
              <li>{t('privacy.s10Item6')}</li>
              <li>{t('privacy.s10Item7')}</li>
            </ul>
          </Section>

          <Section title={t('privacy.s11Title')}>
            <Table
              head={[t('privacy.s11ColType'), t('privacy.s11ColDetail')]}
              rows={[
                [t('privacy.s11Operator'), OPERATOR],
                [t('privacy.s11Dpo'), DPO_NAME],
                [t('privacy.s11Contact'), DPO_CONTACT],
              ]}
            />
            <p className="mt-2 text-xs text-slate-500">{t('privacy.s11Note')}</p>

            <p className="font-semibold text-slate-800 mt-4">
              {t('privacy.s11ReliefTitle')}
            </p>
            <p className="text-xs text-slate-500">{t('privacy.s11ReliefIntro')}</p>
            <Table
              head={[
                t('privacy.s11ColOrg'),
                t('privacy.s11ColPhone'),
                t('privacy.s11ColSite'),
              ]}
              rows={[
                [t('privacy.s11Kisa'), t('privacy.s11KisaPhone'), 'privacy.kisa.or.kr'],
                [t('privacy.s11Kopico'), t('privacy.s11KopicoPhone'), 'www.kopico.go.kr'],
                [t('privacy.s11Spo'), t('privacy.s11SpoPhone'), 'www.spo.go.kr'],
                [t('privacy.s11Police'), t('privacy.s11PolicePhone'), 'ecrm.police.go.kr'],
              ]}
            />
          </Section>

          <Section title={t('privacy.s12Title')}>
            <p>{t('privacy.s12Body')}</p>
            <p className="font-semibold text-slate-800 mt-4">
              {t('privacy.s12HistoryTitle')}
            </p>
            <Table
              head={[
                t('privacy.s12ColVersion'),
                t('privacy.s12ColDate'),
                t('privacy.s12ColChange'),
              ]}
              rows={[
                ['v2', t('privacy.s12V2'), t('privacy.s12V2Change')],
                ['v1', t('privacy.s12V1'), t('privacy.s12V1Change')],
              ]}
            />
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
