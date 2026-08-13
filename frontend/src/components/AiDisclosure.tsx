/**
 * AI 생성물 표시 및 사전 고지 — 「인공지능 발전과 신뢰 기반 조성 등에 관한
 * 기본법」 제31조 (2026.1.22 시행).
 *
 * - 제31조 1항: 생성형 AI 기반 제품·서비스임을 이용자에게 **사전 고지**
 * - 제31조 2항: 결과물이 생성형 AI에 의해 생성되었다는 사실을 **표시**
 * - 위반 시 3천만원 이하 과태료
 *
 * 표시는 "인식하기 쉬운 방법"이어야 하므로, 결과물 바로 옆에 배치하고
 * 시각장애 이용자를 위해 role/aria 속성도 함께 제공한다.
 */
import { useI18n } from '../i18n'

/** 결과물 옆에 붙이는 인라인 배지 (제31조 2항). */
export function AiGeneratedBadge({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  return (
    <span
      role="note"
      aria-label={t('common.aiBadgeAria')}
      className={`inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-200 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-3 h-3"
        fill="currentColor"
      >
        <path d="M12 2l1.9 5.7L19.6 9l-4.5 3.3 1.7 5.7L12 14.6 7.2 18l1.7-5.7L4.4 9l5.7-1.3L12 2z" />
      </svg>
      {t('common.aiBadge')}
    </span>
  )
}

/**
 * 서비스 시작 전 사전 고지 (제31조 1항).
 * 면접 시작 화면처럼 이용자가 AI와 상호작용하기 직전에 노출한다.
 */
export function AiUsageNotice({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  return (
    <div
      role="note"
      className={`rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <AiGeneratedBadge className="shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          {t('common.aiNotice')}
        </p>
      </div>
    </div>
  )
}
