// 경량 i18n — 라이브러리 없이 useSyncExternalStore 기반 전역 로케일 스토어.
// 사용: const { t, locale, setLocale } = useI18n()  (컴포넌트)
//       t('ns.key') / getLocale()                    (비-React 모듈, 예: api.ts)
import { useSyncExternalStore } from 'react'
import * as auth from './auth'
import * as common from './common'
import * as errors from './errors'
import * as history from './history'
import * as interview from './interview'
import * as onboarding from './onboarding'
import * as privacy from './privacy'
import * as processing from './processing'
import * as result from './result'
import * as start from './start'

export type Locale = 'ko' | 'en'

const LOCALE_KEY = 'speechcoach.locale'

const namespaces: Record<string, { ko: Record<string, string>; en: Record<string, string> }> = {
  auth,
  common,
  errors,
  history,
  interview,
  onboarding,
  privacy,
  processing,
  result,
  start,
}

function buildDict(locale: Locale): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const [ns, mod] of Object.entries(namespaces)) {
    for (const [k, v] of Object.entries(mod[locale])) merged[`${ns}.${k}`] = v
  }
  return merged
}

const dicts: Record<Locale, Record<string, string>> = {
  ko: buildDict('ko'),
  en: buildDict('en'),
}

let currentLocale: Locale = localStorage.getItem(LOCALE_KEY) === 'en' ? 'en' : 'ko'
const listeners = new Set<() => void>()

function applyToDocument() {
  document.documentElement.lang = currentLocale
  document.title = dicts[currentLocale]['common.appTitle'] ?? document.title
}
applyToDocument()

export function getLocale(): Locale {
  return currentLocale
}

export function setLocale(locale: Locale) {
  if (locale === currentLocale) return
  currentLocale = locale
  localStorage.setItem(LOCALE_KEY, locale)
  applyToDocument()
  listeners.forEach((fn) => fn())
}

/** 번역 조회. {name} 플레이스홀더는 params로 치환. 키가 없으면 ko → 키 자체 순 폴백. */
export function t(key: string, params?: Record<string, string | number>): string {
  let text = dicts[currentLocale][key] ?? dicts.ko[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v))
  }
  return text
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useI18n() {
  const locale = useSyncExternalStore(subscribe, getLocale)
  return { locale, setLocale, t }
}
