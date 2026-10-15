import jsPDF from 'jspdf'

const formatDate = (iso) => {
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return iso || 'Data a confirmar'
  return `${match[3]}/${match[2]}/${match[1]}`
}

const fileSlug = (value) =>
  String(value || 'evento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'evento'

export function downloadStageMapPdf({ event, stageMap }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 10
  const cardW = 36
  const cardH = 18
  const gap = 2
  const columns = Math.floor((pageWidth - margin * 2 + gap) / (cardW + gap))
  let y = margin

  const ensureSpace = (height) => {
    if (y + height <= pageHeight - margin) return
    doc.addPage()
    y = margin
  }

  const writeHeader = () => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(90, 60, 10)
    doc.text('Racional Jazz Band', margin, y + 6)
    doc.setFontSize(12)
    doc.setTextColor(30, 30, 30)
    const title = doc.splitTextToSize(event?.name || 'Apresentação', pageWidth - margin * 2)[0]
    doc.text(title, margin, y + 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(70, 70, 70)
    const place = event?.location ? ` · ${event.location}` : ''
    doc.text(`${formatDate(event?.date)}${place}`, margin, y + 17)
    y += 22
  }

  writeHeader()

  const drawCards = (items) => {
    items.forEach((item, index) => {
      const column = index % columns
      if (column === 0) ensureSpace(cardH + gap)
      const x = margin + column * (cardW + gap)
      doc.setFillColor(255, 250, 240)
      doc.setDrawColor(180, 140, 40)
      doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, 'FD')
      doc.setFillColor(184, 138, 30)
      doc.rect(x, y, 1.4, cardH, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(30, 30, 30)
      const name = doc.splitTextToSize(item.displayName, cardW - 5)[0]
      doc.text(name, x + 3, y + 5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text(doc.splitTextToSize(item.instrument, cardW - 5)[0], x + 3, y + 9)
      doc.setFontSize(7)
      doc.text(item.state || '—', x + 3, y + 13)
      if (item.status === 'suplente') {
        doc.setFontSize(6)
        doc.setTextColor(120, 80, 10)
        const note = item.replacesName ? `Suplente de ${item.replacesName}` : 'Suplente'
        doc.text(doc.splitTextToSize(note, cardW - 5)[0], x + 3, y + 16.5)
      }
      if (column === columns - 1 || index === items.length - 1) y += cardH + gap
    })
  }

  stageMap.sections.forEach((section) => {
    ensureSpace(12)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(90, 60, 10)
    doc.text(section.title, margin, y + 4)
    y += 6
    if (section.subtitle) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(90, 90, 90)
      doc.text(section.subtitle, margin, y + 3)
      y += 5
    }
    drawCards(section.items)
    y += 2
  })

  if (stageMap.absent.length > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const line = stageMap.absent.map((row) => `${row.name} (${row.instrument})`).join(' · ')
    const lines = doc.splitTextToSize(line, pageWidth - margin * 2)
    ensureSpace(8 + lines.length * 4)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(90, 90, 90)
    doc.text('Faltas', margin, y + 4)
    doc.setFont('helvetica', 'normal')
    doc.text(lines, margin, y + 8)
  }

  const filename = `mapa-palco-${event?.date || 'evento'}-${fileSlug(event?.name)}.pdf`
  doc.save(filename)
}
