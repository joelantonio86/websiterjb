/**
 * Quem pode gerir Partituras e Repertório no admin.
 * Lista exacta + marcadores no local-part do e-mail (rodrigo@..., josenale....@...).
 * Opcional: VITE_SHEETS_ADMIN_EMAILS=email1,email2
 */

export const SHEETS_ADMIN_EMAILS = [
  'joelantoniomg.86@gmail.com',
  'andressamqxs@gmail.com',
  'clarinetabest@hotmail.com',
  'naleribeiro@hotmail.com',
  'edilashirley@gmail.com',
]

/** Local-part (antes do @) que identifica os 4 responsáveis. */
const SHEETS_ADMIN_LOCAL_MARKERS = [
  'joelantoniomg.86',
  'joelantonio',
  'andressamqxs',
  'andressa',
  'rodrigo',
  'josenale',
]

function normalizeEmail (email) {
  return String(email || '').trim().toLowerCase()
}

function envAllowList () {
  return String(import.meta.env.VITE_SHEETS_ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function canManageSheets (userOrEmail) {
  const email = normalizeEmail(
    typeof userOrEmail === 'string' ? userOrEmail : userOrEmail?.email
  )
  if (!email || !email.includes('@')) return false
  if (SHEETS_ADMIN_EMAILS.includes(email)) return true
  if (envAllowList().includes(email)) return true

  const local = email.split('@')[0]
  return SHEETS_ADMIN_LOCAL_MARKERS.some(
    (marker) =>
      local === marker ||
      local.startsWith(`${marker}.`) ||
      local.startsWith(`${marker}_`) ||
      local.startsWith(`${marker}-`) ||
      local.includes(marker)
  )
}
