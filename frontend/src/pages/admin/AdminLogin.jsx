import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { showMessage } from '../../components/MessageBox'

const AdminLogin = () => {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) {
    navigate('/admin', { replace: true })
    return null
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    if (result.success) {
      showMessage('Login bem-sucedido!')
      navigate('/admin', { replace: true })
    } else {
      showMessage(result.message || 'E-mail ou senha incorretos.', true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rjb-bg-light via-rjb-bg-light/95 to-rjb-yellow/5 dark:from-rjb-bg-dark dark:via-rjb-bg-dark/95 dark:to-rjb-yellow/5 pt-16 sm:pt-20 md:pt-28 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-yellow">Área Administrativa</h1>
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
            Acesso restrito a administradores e responsáveis.
          </p>
        </div>

        <section className="rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 backdrop-blur-sm shadow-lg overflow-hidden">
          <header className="px-5 sm:px-6 py-4 border-b border-rjb-yellow/15 bg-rjb-yellow/5 space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-rjb-text dark:text-rjb-text-dark leading-tight">Entrar</h2>
            <p className="text-xs sm:text-sm text-rjb-text/65 dark:text-rjb-text-dark/65">Use seu e-mail e senha para continuar.</p>
          </header>
          <div className="p-5 sm:p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-semibold text-rjb-text dark:text-rjb-text-dark mb-1.5">E-mail</label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-rjb-yellow/30 focus:border-rjb-yellow"
                  placeholder="seu.email@exemplo.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-semibold text-rjb-text dark:text-rjb-text-dark mb-1.5">Senha</label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-rjb-yellow/30 focus:border-rjb-yellow"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-3 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminLogin
