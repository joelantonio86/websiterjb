import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const todayISO = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatDateLabel = (dateStr) => {
  const [year, month, day] = String(dateStr || '').split('-')
  if (!year || !month || !day) return 'Data a confirmar'
  return `${day} de ${MESES[Number(month) - 1] || month} de ${year}`
}

/** Destaque do próximo repertório activo (não arquivado) da API pública. */
export default function NextRepertorioHighlight({ compact = false }) {
  const [repertorios, setRepertorios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    api
      .get('/api/public/repertorios')
      .then(({ data }) => {
        if (mounted) setRepertorios(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (mounted) setRepertorios([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const next = useMemo(() => {
    const today = todayISO()
    const upcoming = repertorios
      .filter((r) => r.date && r.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
    if (upcoming.length) return upcoming[0]
    // se todos já passaram, mostra o mais recente activo
    const past = [...repertorios].sort((a, b) => String(b.date).localeCompare(String(a.date)))
    return past[0] || null
  }, [repertorios])

  if (loading || !next) return null

  const songs = next.songs || []
  const txt = [
    `REPERTÓRIO RJB - ${next.name}`,
    formatDateLabel(next.date) + (next.location ? ` — ${next.location}` : ''),
    '',
    ...songs.map((s, i) => `${i + 1}. ${s.title}`),
  ].join('\n')

  return (
    <div className={`${compact ? 'mb-8' : 'mt-10'} p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-rjb-yellow/15 via-yellow-500/10 to-rjb-yellow/5 dark:from-rjb-yellow/10 dark:via-yellow-500/5 dark:to-rjb-yellow/5 border-2 border-rjb-yellow/40 shadow-xl`}>
      <div className={`flex flex-col ${compact ? 'sm:flex-row sm:items-center' : 'sm:flex-row sm:items-start'} justify-between gap-4 ${compact ? '' : 'mb-4'}`}>
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-3xl flex-shrink-0" aria-hidden>📋</span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-rjb-yellow mb-0.5">Próximo repertório</p>
            <h3 className="text-lg sm:text-xl font-bold text-rjb-text dark:text-rjb-text-dark break-words">
              {next.name}
            </h3>
            <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
              {formatDateLabel(next.date)}
              {next.location ? ` — ${next.location}` : ''}
              {songs.length ? ` · ${songs.length} música${songs.length !== 1 ? 's' : ''}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/repertorio-apresentacoes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rjb-yellow text-rjb-text font-bold text-sm hover:bg-yellow-500 transition-colors"
          >
            Ver repertórios →
          </Link>
          {songs.length > 0 && (
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(txt)}`}
              download={`${(next.name || 'repertorio').replace(/\s+/g, '_')}.txt`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-rjb-yellow/60 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm hover:bg-rjb-yellow/15 transition-colors"
            >
              Baixar lista (TXT)
            </a>
          )}
          <Link
            to={`/partituras?repertorio=${encodeURIComponent(next.id)}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-rjb-yellow/60 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm hover:bg-rjb-yellow/15 transition-colors"
          >
            🎼 Partituras
          </Link>
        </div>
      </div>

      {!compact && songs.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {songs.slice(0, 18).map((item, i) => (
              <div key={`${item.folder}-${item.mp3}-${i}`} className="flex items-center gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rjb-yellow/30 text-rjb-yellow font-semibold text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-rjb-text dark:text-rjb-text-dark">{item.title}</span>
              </div>
            ))}
          </div>
          {songs.length > 18 && (
            <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 mt-3">
              +{songs.length - 18} músicas — vê a página completa de repertórios.
            </p>
          )}
        </>
      )}
    </div>
  )
}
