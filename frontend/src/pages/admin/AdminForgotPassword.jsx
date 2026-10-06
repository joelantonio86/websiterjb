import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const response = await api.post('/api/admin/forgot-password', { email })
      setError(false)
      setMessage(response.data?.message || 'Se o e-mail estiver cadastrado, enviaremos um link para definir uma nova senha.')
    } catch (err) {
      setError(true)
      setMessage(err.response?.data?.message || 'Não foi possível solicitar a redefinição. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rjb-bg-light via-rjb-bg-light/95 to-rjb-yellow/5 dark:from-rjb-bg-dark dark:via-rjb-bg-dark/95 dark:to-rjb-yellow/5 pt-16 sm:pt-20 md:pt-28 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-yellow">Esqueci minha senha</h1>
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
            Informe o e-mail da área administrativa. Enviaremos um link para você definir uma senha nova.
          </p>
        </div>

        <section className="rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-semibold text-rjb-text dark:text-rjb-text-dark mb-1.5">E-mail</label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-rjb-yellow/30 focus:border-rjb-yellow"
                  placeholder="seu.email@exemplo.com"
                  autoComplete="email"
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
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
              <p className="text-center text-sm">
                <Link to="/admin/login" className="font-semibold text-rjb-yellow hover:underline">
                  Voltar ao login
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminForgotPassword
