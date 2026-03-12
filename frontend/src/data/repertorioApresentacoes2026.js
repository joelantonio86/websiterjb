/**
 * Repertório das apresentações de 2026.
 * songs: Array<{ title: string, inProduction?: boolean }>
 * inProduction: true quando a música está em produção (❗)
 *
 * REPERTORIO_MAIO_SHEET_IDS: IDs das partituras que correspondem ao repertório de maio
 * (formato folder-mp3 para uso na página Partituras)
 */
export const REPERTORIO_MAIO_SHEET_IDS = [
  'diversas-Bolero_De_Ravel',
  'diversas-Game_Of_Thrones',
  'racionais-Natureza_Bur',
  'racionais-Oxigenio_Da_Vida',
  'racionais-Imunizar',
  'racionais-Oxigenio',
  'diversas-Still_Loving_You',
  'diversas-As_Forcas_Da_Natureza',
  'diversas-Olhos_Coloridos',
  'diversas-O_Canto_Das_Tres_Racas',
  'diversas-Que_Nem_Mare',
]

export const REPERTORIO_MAIO_2026 = [
  { title: 'Bolero de Ravel' },
  { title: 'Game of Thrones' },
  { title: 'Natureza BUR' },
  { title: 'Oxigênio da vida' },
  { title: 'Orlando Dias imunizar' },
  { title: 'Oxigênio Rosa' },
  { title: 'Scorpions Still love you' },
  { title: 'Stand by me' },
  { title: 'A little respect', inProduction: true },
  { title: 'Forças da natureza' },
  { title: 'Olhos coloridos' },
  { title: 'O canto das três raças' },
  { title: 'Que nem maré' },
  { title: 'Se for amor (João Gomes)', inProduction: true },
  { title: 'P de pecado (Simone Mendes e menos é mais)', inProduction: true },
  { title: 'Coração partido (menos é mais)', inProduction: true },
  { title: 'Trem BALA (Ana Vilela)', inProduction: true },
]

export const REPERTORIO_APRESENTACOES_2026 = [
  {
    id: '2026-05-13',
    date: '2026-05-13',
    dateLabel: '13 de maio de 2026',
    dateShort: '13 MAI 2026',
    title: 'Apresentação RJB',
    location: 'Local a confirmar',
    songs: REPERTORIO_MAIO_2026,
  },
  {
    id: '2026-10-04',
    date: '2026-10-04',
    dateLabel: '4 de outubro de 2026',
    dateShort: '4 OUT 2026',
    title: 'Apresentação RJB',
    location: 'Local a confirmar',
    songs: []
  },
  {
    id: '2026-12-30',
    date: '2026-12-30',
    dateLabel: '30 de dezembro de 2026',
    dateShort: '30 DEZ 2026',
    title: 'Apresentação RJB',
    location: 'Local a confirmar',
    songs: []
  }
]
