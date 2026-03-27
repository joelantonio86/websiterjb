import api from './api'
import { formatPeriodLabel } from '../data/mediaGalleryPeriods'

function normalizeStaticEvents (events = []) {
  return [...events]
}

export async function fetchAdminYoutubeVideosPublic (category) {
  try {
    const response = await api.get('/api/public/youtube-videos', {
      params: category ? { category } : {}
    })
    return response.data || []
  } catch {
    return []
  }
}

export async function fetchAdminPhotosPublic () {
  try {
    const response = await api.get('/api/public/photos')
    return response.data || []
  } catch {
    return []
  }
}

export function mergeEventsWithAdminYoutube (staticEvents = [], adminVideos = [], categoryLabel) {
  const grouped = new Map()

  normalizeStaticEvents(staticEvents).forEach((ev) => {
    const key = ev.date
    grouped.set(key, { ...ev, videos: [...(ev.videos || [])] })
  })

  adminVideos.forEach((v) => {
    const periodKey = v.periodKey
    if (!periodKey || !/^\d{4}-\d{2}$/.test(periodKey)) return
    const date = `${periodKey}-01`
    const current = grouped.get(date) || {
      date,
      dateFormatted: formatPeriodLabel(periodKey),
      eventTitle: `${categoryLabel} (Admin)`,
      location: 'YouTube',
      videos: []
    }
    current.videos.push({
      title: v.title,
      id: v.youtubeId
    })
    grouped.set(date, current)
  })

  return Array.from(grouped.values()).sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function mergeEventsWithAdminPhotos (staticEvents = [], adminPhotos = []) {
  const grouped = new Map()

  normalizeStaticEvents(staticEvents).forEach((ev) => {
    grouped.set(ev.date, { ...ev, photos: [...(ev.photos || [])] })
  })

  adminPhotos.forEach((photo) => {
    if (!photo?.url) return
    const periodKey = photo.periodKey
    if (!periodKey || !/^\d{4}-\d{2}$/.test(periodKey)) return
    const date = `${periodKey}-01`
    const current = grouped.get(date) || {
      date,
      dateFormatted: formatPeriodLabel(periodKey),
      eventTitle: 'Galeria RJB',
      location: 'Envio administrativo',
      photos: []
    }
    current.photos.push(photo.url)
    grouped.set(date, current)
  })

  return Array.from(grouped.values()).sort((a, b) => new Date(b.date) - new Date(a.date))
}
