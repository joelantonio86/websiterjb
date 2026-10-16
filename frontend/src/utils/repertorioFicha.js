export const FICHA_LIMITS = {
  regencia: 80,
  interprete: 80,
  partEsp: 80,
  observacao: 240,
}

function clip(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function songKey(song) {
  return `${song?.folder || ''}-${song?.mp3 || ''}`
}

export function blankFicha(song = {}) {
  return {
    title: clip(song.title, 160),
    folder: clip(song.folder, 40),
    mp3: clip(song.mp3, 160),
    regencia: clip(song.regencia, FICHA_LIMITS.regencia),
    interprete: clip(song.interprete, FICHA_LIMITS.interprete),
    partEsp: clip(song.partEsp, FICHA_LIMITS.partEsp),
    observacao: clip(song.observacao, FICHA_LIMITS.observacao),
  }
}

export function toggleOrderedSong(songs, song, savedSongs = []) {
  const list = Array.isArray(songs) ? songs : []
  const id = songKey(song)
  if (list.some((item) => songKey(item) === id)) {
    return list.filter((item) => songKey(item) !== id)
  }

  const savedList = Array.isArray(savedSongs) ? savedSongs : []
  const savedIndex = savedList.findIndex((item) => songKey(item) === id)
  const nextSong = blankFicha(savedIndex >= 0 ? savedList[savedIndex] : song)
  if (savedIndex < 0) return [...list, nextSong]

  const insertAt = savedList
    .slice(0, savedIndex)
    .filter((item) => list.some((current) => songKey(current) === songKey(item)))
    .length
  const next = list.slice()
  next.splice(insertAt, 0, nextSong)
  return next
}

export function moveSong(songs, index, direction) {
  const target = index + direction
  if (!Array.isArray(songs) || target < 0 || target >= songs.length) return songs
  const next = songs.slice()
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}
