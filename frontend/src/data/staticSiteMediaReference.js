import { PHOTOS_BY_EVENT } from './photos'
import { BASTIDORES_BY_EVENT, APRESENTACOES_BY_EVENT } from './videos'

/**
 * Lista mídia definida no código (site público) para um prefixo de mês (ex.: "2025-12").
 * Não inclui uploads da área admin (Google Cloud Storage).
 */
export function getStaticSiteMediaForMonth (monthPrefix) {
  const mp = String(monthPrefix || '').slice(0, 7)
  if (!/^\d{4}-\d{2}$/.test(mp)) {
    return { photos: [], bastidorVideos: [], apresentacaoVideos: [] }
  }

  const photoEvents = PHOTOS_BY_EVENT.filter((e) => e.date.startsWith(mp))
  const photos = photoEvents.flatMap((e) =>
    (e.photos || []).map((url, i) => ({
      url,
      eventDateLabel: e.dateFormatted,
      eventTitle: e.eventTitle,
      location: e.location,
      key: `ph-${e.date}-${i}`
    }))
  )

  const bastEvents = BASTIDORES_BY_EVENT.filter((e) => e.date.startsWith(mp))
  const bastidorVideos = bastEvents.flatMap((e) =>
    (e.videos || []).map((v, i) => ({
      title: v.title,
      youtubeId: v.id,
      eventDateLabel: e.dateFormatted,
      eventTitle: e.eventTitle,
      location: e.location,
      key: `bst-${e.date}-${i}`
    }))
  )

  const apreEvents = APRESENTACOES_BY_EVENT.filter((e) => e.date.startsWith(mp))
  const apresentacaoVideos = apreEvents.flatMap((e) =>
    (e.videos || []).map((v, i) => ({
      title: v.title,
      youtubeId: v.id,
      eventDateLabel: e.dateFormatted,
      eventTitle: e.eventTitle,
      location: e.location,
      key: `apr-${e.date}-${i}`
    }))
  )

  return { photos, bastidorVideos, apresentacaoVideos }
}
