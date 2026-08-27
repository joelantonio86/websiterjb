import api from './api'

const MESES_ABREV = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']

const todayISO = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Converte um repertório da API pública em evento no formato consumido pela
 * Home e pela Agenda. Mantém o mesmo shape que o antigo AGENDA_EVENTS
 * (dateString, title, location, link, time) para o mínimo de refactor nas telas.
 */
export const mapRepertorioToAgendaEvent = (repertorio) => {
  const rawDate = String(repertorio?.date || '')
  const [year, month, day] = rawDate.split('-')
  const monthIndex = Number(month) - 1
  const dateString = day && month && year
    ? `${Number(day)} ${MESES_ABREV[monthIndex] || month} ${year}`
    : '-- --- ----'
  return {
    id: repertorio.id,
    date: rawDate,
    dateString,
    title: repertorio.name || 'Apresentação RJB',
    location: repertorio.location || 'Local a confirmar',
    time: 'A confirmar',
    link: '/repertorio-apresentacoes',
  }
}

/**
 * Busca a lista completa de repertórios públicos (ativos) do backend.
 * Nunca lança — devolve [] em caso de erro.
 */
export const fetchPublicRepertorios = async () => {
  try {
    const { data } = await api.get('/api/public/repertorios')
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

/**
 * A partir da lista bruta da API, devolve os eventos futuros (date >= hoje),
 * ordenados ascendentemente, já no shape de AGENDA_EVENTS.
 */
export const getUpcomingEvents = (repertorios) => {
  const today = todayISO()
  return (repertorios || [])
    .filter((r) => r?.date && r.date >= today && !r.archived)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(mapRepertorioToAgendaEvent)
}
