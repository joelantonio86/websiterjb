const FINANCE_ROLES = ['financeiro', 'admin-financeiro', 'financeiro-view']

const FINANCE_VIEW_EMAILS = ['andressamqxs@gmail.com']

export function canViewFinance(user) {
  if (!user) return false
  if (FINANCE_ROLES.includes(user.role)) return true
  const email = String(user.email || '').trim().toLowerCase()
  return FINANCE_VIEW_EMAILS.includes(email)
}
