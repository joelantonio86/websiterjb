import { getSortKey, getSopradoNaipe, naipeKey } from './stageLayout.js'

export const CALL_STATUSES = ['presente', 'falta', 'suplente']

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export function normalizeUf(value) {
  const raw = String(value || '').trim().toUpperCase()
  if (UFS.includes(raw)) return raw
  if (raw.length >= 2 && UFS.includes(raw.slice(0, 2))) return raw.slice(0, 2)
  return '—'
}

export function shortDisplayName(name, names) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  const first = parts[0] || 'Sem nome'
  const firstKey = first.toLowerCase()
  const duplicates = names.filter((item) => String(item || '').trim().split(/\s+/)[0]?.toLowerCase() === firstKey).length
  if (duplicates > 1 && parts.length >= 2) return `${parts[0]} ${parts[1]}`
  return first
}

export function mergeChamada(members, savedEntries) {
  const saved = new Map((savedEntries || []).map((entry) => [entry.memberId, entry]))
  return (members || [])
    .filter((member) => member?.id && String(member.name || '').trim())
    .map((member) => {
      const previous = saved.get(member.id)
      const status = CALL_STATUSES.includes(previous?.status) ? previous.status : 'presente'
      return {
        memberId: member.id,
        name: String(member.name).trim(),
        instrument: String(member.instrument || '').trim() || 'Não informado',
        state: normalizeUf(member.state),
        status,
        replacesMemberId: status === 'suplente' ? String(previous?.replacesMemberId || '') : '',
      }
    })
    .sort((a, b) => {
      const [catA, subA] = getSortKey(a.instrument)
      const [catB, subB] = getSortKey(b.instrument)
      if (catA !== catB) return catA - catB
      if (subA !== subB) return subA - subB
      return a.name.localeCompare(b.name, 'pt')
    })
}

export function validateChamada(rows) {
  const byId = new Map(rows.map((row) => [row.memberId, row]))
  const usedReplacements = new Set()

  for (const row of rows) {
    if (!CALL_STATUSES.includes(row.status)) return 'Situação de chamada inválida.'
    if (row.status !== 'suplente') continue
    const replaced = byId.get(row.replacesMemberId)
    if (!replaced) return `${row.name} está como suplente sem indicar quem faltou.`
    if (replaced.status !== 'falta') return `${row.name} só pode substituir alguém marcado com falta.`
    if (naipeKey(row.instrument) !== naipeKey(replaced.instrument)) {
      return `${row.name} precisa ser do mesmo naipe de ${replaced.name}.`
    }
    if (usedReplacements.has(replaced.memberId)) {
      return `${replaced.name} já tem um suplente neste evento.`
    }
    usedReplacements.add(replaced.memberId)
  }
  return null
}

function compareOnStage(a, b) {
  const [catA, subA] = getSortKey(a.instrument)
  const [catB, subB] = getSortKey(b.instrument)
  if (catA !== catB) return catA - catB
  if (catA === 5 && subA !== subB) return subA - subB
  return a.displayName.localeCompare(b.displayName, 'pt')
}

export function buildStageMap(rows) {
  const names = rows.map((row) => row.name)
  const decorated = rows.map((row) => {
    const replaced = rows.find((item) => item.memberId === row.replacesMemberId)
    return {
      ...row,
      displayName: shortDisplayName(row.name, names),
      replacesName: replaced ? shortDisplayName(replaced.name, names) : '',
    }
  })

  const onStage = decorated
    .filter((row) => row.status === 'presente' || row.status === 'suplente')
    .sort(compareOnStage)
  const absent = decorated
    .filter((row) => row.status === 'falta')
    .sort((a, b) => a.name.localeCompare(b.name, 'pt'))

  const take = (predicate) => onStage.filter(predicate)
  const soprado = onStage.filter((row) => getSortKey(row.instrument)[0] === 5)
  const madeiras = []
  const metaisAgudos = []
  const metaisGraves = []
  soprado.forEach((row) => {
    const { band } = getSopradoNaipe(row.instrument)
    if (band === 'madeiras') madeiras.push(row)
    else if (band === 'metais_agudos') metaisAgudos.push(row)
    else metaisGraves.push(row)
  })

  const sections = [
    { id: 'regentes', title: 'Regentes', items: take((row) => getSortKey(row.instrument)[0] === 1) },
    { id: 'vozes', title: 'Vozes', items: take((row) => getSortKey(row.instrument)[0] === 2) },
    { id: 'percussao', title: 'Percussão', items: take((row) => getSortKey(row.instrument)[0] === 3) },
    { id: 'cordas', title: 'Cordas e teclas', items: take((row) => getSortKey(row.instrument)[0] === 4) },
    { id: 'madeiras', title: 'Naipe de madeiras', subtitle: 'Flautas, clarinetes, sax alto e sax tenor', items: madeiras },
    { id: 'metais-agudos', title: 'Naipe de metais', subtitle: 'Trompetes e trompas', items: metaisAgudos },
    { id: 'metais-graves', title: 'Naipe de metais', subtitle: 'Trombones, trombones baixos, bombardinos e tubas', items: metaisGraves },
    { id: 'demais', title: 'Demais colaboradores', items: take((row) => getSortKey(row.instrument)[0] === 6) },
  ].filter((section) => section.items.length > 0)

  return { sections, onStage, absent }
}
