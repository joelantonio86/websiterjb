import { AGENDA_EVENTS } from './events'

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

/**
 * Formata "2026-05" → "Maio 2026"
 */
export function formatPeriodLabel (periodKey) {
  if (!periodKey || !/^\d{4}-\d{2}$/.test(periodKey)) return periodKey || ''
  const [y, m] = periodKey.split('-').map(Number)
  return `${MONTHS_PT[m - 1]} ${y}`
}

/**
 * Períodos para galeria admin: Dezembro 2025 em diante + um mês por cada data
 * já cadastrada na agenda (AGENDA_EVENTS).
 */
export function getMediaGalleryPeriods () {
  const keys = new Set(['2025-12'])
  AGENDA_EVENTS.forEach((ev) => {
    const d = ev.date
    if (typeof d === 'string' && d.length >= 7) {
      const ym = d.slice(0, 7)
      if (ym >= '2025-12') keys.add(ym)
    }
  })
  return Array.from(keys)
    .sort()
    .map((id) => ({
      id,
      label: formatPeriodLabel(id)
    }))
}
