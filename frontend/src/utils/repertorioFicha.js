const LIMITS = {
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
    regencia: clip(song.regencia, LIMITS.regencia),
    interprete: clip(song.interprete, LIMITS.interprete),
    partEsp: clip(song.partEsp, LIMITS.partEsp),
    observacao: clip(song.observacao, LIMITS.observacao),
  }
}

export function moveSong(songs, index, direction) {
  const target = index + direction
  if (!Array.isArray(songs) || target < 0 || target >= songs.length) return songs
  const next = songs.slice()
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}
