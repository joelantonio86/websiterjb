import { R2_BASE_URL } from './songs'

/** Slugs alinhados aos nomes de arquivo no R2 (sem espaços). */
export const INSTRUMENTOS_NAIPE = [
  { slug: 'base', nome: 'Base' },
  { slug: 'harmonia', nome: 'Harmonia' },
  { slug: 'flautim', nome: 'Flautim' },
  { slug: 'flauta', nome: 'Flauta' },
  { slug: 'clarinete', nome: 'Clarinete' },
  { slug: 'sax_soprano', nome: 'Sax Soprano' },
  { slug: 'sax_alto', nome: 'Sax Alto' },
  { slug: 'sax_tenor', nome: 'Sax Tenor' },
  { slug: 'sax_baritono', nome: 'Sax Barítono' },
  { slug: 'trompete', nome: 'Trompete' },
  { slug: 'trompa', nome: 'Trompa' },
  { slug: 'trombone', nome: 'Trombone' },
  { slug: 'bombardino', nome: 'Bombardino' },
  { slug: 'tuba', nome: 'Tuba' },
  { slug: 'baixo', nome: 'Baixo elétrico' },
  { slug: 'bateria', nome: 'Bateria' },
  { slug: 'lira', nome: 'Lira' },
]

/**
 * URL do PDF consolidado por naipe no R2 (pré-gerado pela equipe).
 * Padrão: {R2_BASE_URL}/consolidado_naipe/{racionais|diversas}/{instrumento}.pdf
 * Pasta configurável: VITE_R2_CONSOLIDADO_FOLDER
 */
export function buildConsolidadoNaipeUrl(categoria, instrumentSlug) {
  const subfolder = import.meta.env.VITE_R2_CONSOLIDADO_FOLDER || 'consolidado_naipe'
  const safeCat = categoria === 'diversas' ? 'diversas' : 'racionais'
  const safeInst = String(instrumentSlug || '').replace(/[^a-z0-9_]/gi, '')
  return `${R2_BASE_URL}/${subfolder}/${safeCat}/${safeInst}.pdf`
}
