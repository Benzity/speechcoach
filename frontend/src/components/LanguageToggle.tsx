import { useI18n, type Locale } from '../i18n'

function LocaleButton({
  value,
  locale,
  onSelect,
}: {
  value: Locale
  locale: Locale
  onSelect: (v: Locale) => void
}) {
  const active = locale === value
  return (
    <button
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={
        'px-1.5 py-0.5 rounded transition-colors ' +
        (active ? 'text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-600')
      }
    >
      {value.toUpperCase()}
    </button>
  )
}

// 사이트 UI 언어 토글 (KO/EN). 헤더/랜딩 nav에 삽입되는 최소 크기 컨트롤.
export default function LanguageToggle() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="flex items-center text-xs font-semibold select-none">
      <LocaleButton value="ko" locale={locale} onSelect={setLocale} />
      <span className="text-slate-300">|</span>
      <LocaleButton value="en" locale={locale} onSelect={setLocale} />
    </div>
  )
}
