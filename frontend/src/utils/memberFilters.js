// Busca da área de membros: nome e instrumento, ignorando acento, caixa e espaços extras.
export function normalizeMemberText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function filterMembers(members, filters = {}) {
  let filtered = [...members]
  const nameQuery = normalizeMemberText(filters.name)
  const instrumentQuery = normalizeMemberText(filters.instrument)
  const location = String(filters.location || '').trim()

  if (nameQuery) {
    filtered = filtered.filter((member) => {
      const name = normalizeMemberText(member.name)
      const instrument = normalizeMemberText(member.instrument)
      return name.includes(nameQuery) || instrument.includes(nameQuery)
    })
  }

  if (instrumentQuery) {
    filtered = filtered.filter((member) => normalizeMemberText(member.instrument) === instrumentQuery)
  }

  if (location) {
    filtered = filtered.filter((member) => `${member.city || ''}/${member.state || ''}`.trim() === location)
  }

  return filtered
}

function cleanInstrumentLabel(value) {
  return String(value || '')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function uniqueMemberInstruments(members) {
  const labels = new Map()
  members.forEach((member) => {
    const key = normalizeMemberText(member.instrument)
    if (!key || labels.has(key)) return
    labels.set(key, cleanInstrumentLabel(member.instrument))
  })
  return Array.from(labels.values()).sort((a, b) => a.localeCompare(b, 'pt'))
}
