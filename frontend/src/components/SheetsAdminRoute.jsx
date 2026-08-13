import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { canManageSheets } from '../utils/sheetsAdminAccess'

/** Bloqueia /admin/partituras e /admin/repertorios a quem não está na allowlist. */
export default function SheetsAdminRoute ({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-base text-rjb-text/70 dark:text-rjb-text-dark/70">Carregando…</div>
      </div>
    )
  }

  if (!canManageSheets(user)) {
    return <Navigate to="/admin" replace />
  }

  return children
}
