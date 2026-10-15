// Ordem de palco compartilhada pelo mapa público e pela chamada do evento.
export const CATEGORY_ORDER = [
  { id: 1, label: 'Regentes', keywords: ['regente', 'regência', 'maestro', 'direção', 'diretor musical', 'condutor'], accentBorder: 'border-l-4 border-l-amber-600 dark:border-l-amber-500', lineClr: 'bg-amber-600', badge: 'text-amber-700 dark:text-amber-400' },
  { id: 2, label: 'Vozes', keywords: ['voz', 'vocal', 'canto', 'cantor', 'cantora', 'cantora(o)', 'vocalista'], accentBorder: 'border-l-4 border-l-teal-600 dark:border-l-teal-400', lineClr: 'bg-teal-600', badge: 'text-teal-700 dark:text-teal-400' },
  { id: 3, label: 'Percussão', keywords: ['bateria', 'percussão', 'percussion', 'tambor', 'surdo', 'pandeiro', 'congas', 'atabaque', 'percussionista', 'baterista'], accentBorder: 'border-l-4 border-l-amber-600 dark:border-l-amber-500', lineClr: 'bg-amber-600', badge: 'text-amber-700 dark:text-amber-400' },
  { id: 4, label: 'Cordas e teclas', keywords: ['guitarra', 'lira', 'piano', 'cozinha', 'baixo'], accentBorder: 'border-l-4 border-l-amber-700 dark:border-l-amber-500', lineClr: 'bg-amber-700', badge: 'text-amber-800 dark:text-amber-400' },
  {
    id: 5,
    label: 'Soprado (madeiras e metais)',
    keywords: ['flauta', 'flautista', 'clarinete', 'clarineta', 'sax soprano', 'saxofone soprano', 'sax alto', 'saxofone alto', 'sax tenor', 'saxofone tenor', 'trompete', 'trumpet', 'flugelhorn', 'trompa', 'trombone', 'sax barítono', 'sax baritono', 'saxofone barítono', 'tuba', 'eufônio', 'eufonia', 'bombardino', 'saxofone', 'sax', 'sopros', 'soprado'],
    accentBorder: 'border-l-4 border-l-rjb-yellow dark:border-l-amber-400',
    lineClr: 'bg-rjb-yellow',
    badge: 'text-amber-800 dark:text-amber-400',
  },
  { id: 6, label: 'Demais colaboradores', keywords: [], accentBorder: 'border-l-4 border-l-stone-500 dark:border-l-stone-400', lineClr: 'bg-stone-500', badge: 'text-stone-600 dark:text-stone-400' },
]

const MADEIRAS_ORDER = [
  'flauta', 'flautista',
  'clarinete', 'clarineta',
  'sax soprano', 'saxofone soprano',
  'sax alto', 'saxofone alto',
  'sax tenor', 'saxofone tenor',
  'saxofone', 'sax',
]
const METAIS_AGUDOS_ORDER = ['trompete', 'trumpet', 'flugelhorn', 'trompa']
const METAIS_GRAVES_ORDER = ['trombone', 'trombone baixo', 'bombardino', 'eufônio', 'eufonia', 'tuba']

export const normalizeStageText = (value) =>
  String(value || '').toLowerCase().normalize('NFD').replace(/\u0300-\u036f/g, '').trim()

export function getSopradoNaipe(instrument) {
  const inst = instrument ? normalizeStageText(instrument) : ''
  if (!inst) return { band: 'metais_graves', subIndex: 99 }

  if (inst.includes('trombone') && inst.includes('baixo')) {
    return { band: 'metais_graves', subIndex: 1 }
  }

  for (let i = 0; i < MADEIRAS_ORDER.length; i++) {
    if (inst.includes(normalizeStageText(MADEIRAS_ORDER[i]))) return { band: 'madeiras', subIndex: i }
  }
  for (let i = 0; i < METAIS_AGUDOS_ORDER.length; i++) {
    if (inst.includes(normalizeStageText(METAIS_AGUDOS_ORDER[i]))) return { band: 'metais_agudos', subIndex: i }
  }
  for (let i = 0; i < METAIS_GRAVES_ORDER.length; i++) {
    if (inst.includes(normalizeStageText(METAIS_GRAVES_ORDER[i]))) return { band: 'metais_graves', subIndex: i }
  }
  return { band: 'metais_graves', subIndex: 99 }
}

function getSopradoSortKey(instrument) {
  const { band, subIndex } = getSopradoNaipe(instrument)
  if (band === 'madeiras') return subIndex
  if (band === 'metais_agudos') return 100 + subIndex
  return 200 + subIndex
}

export function getSortKey(instrument) {
  const inst = normalizeStageText(instrument)
  if (!inst) return [6, 999, instrument]
  for (let c = 0; c < CATEGORY_ORDER.length - 1; c++) {
    const cat = CATEGORY_ORDER[c]
    for (const kw of cat.keywords) {
      if (inst.includes(normalizeStageText(kw))) {
        if (cat.id === 4 && normalizeStageText(kw) === 'baixo' && inst.includes('trombone')) continue
        if (cat.id === 5) return [5, getSopradoSortKey(instrument), instrument]
        return [cat.id, 0, instrument]
      }
    }
  }
  return [6, 0, instrument]
}

export function naipeKey(instrument) {
  const [cat] = getSortKey(instrument)
  if (cat === 5) return `soprado:${getSopradoNaipe(instrument).band}`
  return `cat:${cat}`
}

export function naipeLabel(instrument) {
  const [cat] = getSortKey(instrument)
  if (cat !== 5) return CATEGORY_ORDER.find((item) => item.id === cat)?.label || 'Demais colaboradores'
  const { band } = getSopradoNaipe(instrument)
  if (band === 'madeiras') return 'Naipe de madeiras'
  if (band === 'metais_agudos') return 'Trompetes e trompas'
  return 'Trombones, bombardinos e tubas'
}
