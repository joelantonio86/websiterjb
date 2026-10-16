import jsPDF from 'jspdf'
import 'jspdf-autotable'

const formatDate = (iso) => {
  const match = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return ''
  return `${match[3]}/${match[2]}/${match[1]}`
}

const fileSlug = (value) =>
  String(value || 'repertorio')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'repertorio'

export function downloadRepertorioFichaPdf({ name, date, location, songs }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(20, 20, 20)
  doc.text(name || 'Repertório', pageWidth / 2, 12, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const meta = [formatDate(date), location].filter(Boolean).join(' · ')
  if (meta) doc.text(meta, pageWidth / 2, 18, { align: 'center' })

  const rows = Array.isArray(songs) ? songs : []
  doc.autoTable({
    startY: meta ? 22 : 16,
    head: [['Nº', 'NOME DA MÚSICA', 'REG.', 'INTÉRPRETE', 'PART. ESP.', 'OBSERVAÇÕES']],
    body: rows.map((song, index) => [
      String(index + 1),
      song.title || '',
      song.regencia || '',
      song.interprete || '',
      song.partEsp || '',
      song.observacao || '',
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      valign: 'middle',
      cellPadding: 1.4,
      fillColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 74 },
      2: { cellWidth: 34 },
      3: { cellWidth: 50 },
      4: { cellWidth: 32, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4 && String(data.cell.raw || '').trim()) {
        data.cell.styles.fillColor = [214, 234, 248]
      }
    },
    margin: { left: 10, right: 10 },
  })

  const filename = `ficha-${date || 'repertorio'}-${fileSlug(name)}.pdf`
  doc.save(filename)
}
