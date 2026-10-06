import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../../services/api'

const AdminResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => searchParams.get('token') || '', [searchParams])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError(true)
      setMessage('As senhas não coincidem.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      const response = await api.post('/api/admin/reset-password', { token, password })
      setError(false)
      setMessage(response.data?.message || 'Senha atualizada.')
      setTimeout(() => navigate('/admin/login', { replace: true }), 1200)
    } catch (err) {
      setError(true)
      setMessage(err.response?.data?.message || 'Não foi possível atualizar a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rjb-bg-light via-rjb-bg-light/95 to-rjb-yellow/5 dark:from-rjb-bg-dark dark:via-rjb-bg-dark/95 dark:to-rjb-yellow/5 pt-16 sm:pt-20 md:pt-28 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-yellow">Definir nova senha</h1>
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
            Escolha uma senha nova para a área administrativa. A senha anterior deixa de valer.
          </p>
        </div>

        <section className="rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="p-5 sm:p-6">
            {!token ? (
              <div className="space-y-4">
                <p className="text-sm text-red-600 dark:text-red-400">Este link de redefinição está incompleto. Solicite um novo.</p>
                <Link to="/admin/esqueci-senha" className="inline-block font-semibold text-rjb-yellow hover:underline">
                  Solicitar novo link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-sm font-semibold text-rjb-text dark:text-rjb-text-dark mb-1.5">Nova senha</label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-rjb-yellow/30 focus:border-rjb-yellow"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-rjb-text dark:text-rjb-text-dark mb-1.5">Confirmar senha</label>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-rjb-yellow/30 focus:border-rjb-yellow"
                    autoComplete="new-password"
                  />
                </div>
                {message && (
                  <p className={`text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-rjb-text dark:text-rjb-text-dark'}`} role="status">
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-3 rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
                <p className="text-center text-sm">
                  <Link to="/admin/login" className="font-semibold text-rjb-yellow hover:underline">
                    Voltar ao login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminResetPassword
