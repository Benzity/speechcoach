import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteSession, listMySessions, type SessionListItem, type SessionStatus } from '../api'
import { useI18n } from '../i18n'

const STATUS_LABEL_KEY: Record<SessionStatus, string> = {
  created: 'history.statusCreated',
  in_progress: 'history.statusInProgress',
  analyzing: 'history.statusAnalyzing',
  completed: 'history.statusCompleted',
  failed: 'history.statusFailed',
}

const STATUS_STYLE: Record<SessionStatus, string> = {
  created: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-700',
  analyzing: 'bg-violet-100 text-violet-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { t, locale } = useI18n()
  const [items, setItems] = useState<SessionListItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listMySessions()
      .then(setItems)
      .catch((e) => setError((e as Error).message))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm(t('history.deleteConfirm'))) return
    try {
      await deleteSession(id)
      setItems((prev) => (prev ?? []).filter((s) => s.id !== id))
    } catch (e) {
      alert((e as Error).message)
    }
  }

  function handleOpen(s: SessionListItem) {
    if (s.status === 'completed') navigate(`/result/${s.id}`)
    else if (s.status === 'analyzing' || s.status === 'in_progress')
      navigate(`/processing/${s.id}`)
    else navigate(`/interview/${s.id}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t('history.title')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t('history.subtitle')}
            </p>
          </div>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-sm"
          >
            {t('history.newInterview')}
          </Link>
        </div>

        {error && (
          <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {items === null && !error && (
          <div className="text-center text-slate-400 py-20">{t('history.loading')}</div>
        )}

        {items !== null && items.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">{t('history.emptyMessage')}</p>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {t('history.startFirstInterview')}
            </Link>
          </div>
        )}

        {items && items.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((s) => (
              <div
                key={s.id}
                onClick={() => handleOpen(s)}
                className="group bg-white rounded-2xl p-5 border border-slate-100 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100/60 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded ${STATUS_STYLE[s.status]}`}
                  >
                    {t(STATUS_LABEL_KEY[s.status])}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(s.id)
                    }}
                    className="text-slate-300 hover:text-rose-500 text-xs"
                    title={t('history.deleteTitle')}
                  >
                    ✕
                  </button>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1 tracking-tight">
                  {s.job_title}
                </h3>
                <div className="text-xs text-slate-500 mb-3">
                  {t('history.questionCount', { count: s.question_count })} ·{' '}
                  {new Date(s.created_at).toLocaleString(locale === 'en' ? 'en-US' : 'ko-KR', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {s.overall_score !== null && (
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold bg-gradient-to-br from-sky-500 to-blue-700 bg-clip-text text-transparent tracking-tighter">
                      {Math.round(s.overall_score)}
                    </span>
                    <span className="text-slate-400 text-sm mb-1">/100</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
