import JSZip from 'jszip'
import { racionais, diversas } from '../data/songs'
import { REPERTORIO_MAIO_SHEET_IDS } from '../data/repertorioApresentacoes2026'
import { API_BASE } from '../services/api'

function getMaioSheets() {
  const allSheets = [
    ...racionais.map(s => ({ ...s, folder: 'racionais' })),
    ...diversas.map(s => ({ ...s, folder: 'diversas' })),
  ]
  const idSet = new Set(
    REPERTORIO_MAIO_SHEET_IDS.filter(id => {
      const dashIdx = id.indexOf('-')
      const folder = id.slice(0, dashIdx)
      const mp3 = id.slice(dashIdx + 1)
      return (folder === 'racionais' ? racionais : diversas).some(s => s.mp3 === mp3)
    })
  )
  return allSheets.filter(s => idSet.has(`${s.folder}-${s.mp3}`))
}

export async function downloadMaioRepertoirePdfs({ onProgress } = {}) {
  const sheets = getMaioSheets()
  if (sheets.length === 0) return { totalOk: 0, failed: [] }

  const failed = []
  const zip = new JSZip()
  const racionaisFiles = []
  const diversasFiles = []
  const proxyUrl = (folder, file) =>
    `${API_BASE}/api/public/partituras/proxy?folder=${encodeURIComponent(folder)}&file=${encodeURIComponent(file)}`

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i]
    const url = proxyUrl(sheet.folder, sheet.mp3)
    try {
      const res = await fetch(url)
      if (res.ok) {
        const blob = await res.blob()
        const fileName = `${sheet.title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`
        const entry = { fileName, blob }
        if (sheet.folder === 'racionais') racionaisFiles.push(entry)
        else diversasFiles.push(entry)
      } else {
        failed.push(sheet.title)
      }
    } catch (e) {
      failed.push(sheet.title)
    }
    onProgress?.(Math.round(((i + 1) / sheets.length) * 90))
  }

  const totalOk = racionaisFiles.length + diversasFiles.length
  if (totalOk === 0) return { totalOk: 0, failed }

  onProgress?.(95)
  if (racionaisFiles.length > 0) {
    const folder = zip.folder('Racionais')
    racionaisFiles.forEach(({ fileName, blob }) => folder.file(fileName, blob))
  }
  if (diversasFiles.length > 0) {
    const folder = zip.folder('Outros_Classicos')
    diversasFiles.forEach(({ fileName, blob }) => folder.file(fileName, blob))
  }

  const content = await zip.generateAsync({ type: 'blob' })
  onProgress?.(100)

  const a = document.createElement('a')
  a.href = URL.createObjectURL(content)
  a.download = `Partituras_RJB_Repertorio_Maio_${new Date().toISOString().slice(0, 10)}.zip`
  a.click()
  URL.revokeObjectURL(a.href)

  return { totalOk, failed }
}
