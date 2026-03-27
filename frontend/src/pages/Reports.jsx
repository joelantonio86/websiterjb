import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { showMessage } from '../components/MessageBox'
import MembersReport from '../components/admin/MembersReport'
import InvitesManagement from '../components/admin/InvitesManagement'
import AttachmentsManagement from '../components/admin/AttachmentsManagement'
import api from '../services/api'

const StatCard = ({ title, value, tone = 'yellow' }) => {
  const toneMap = {
    yellow: 'border-rjb-yellow/25 bg-rjb-yellow/5 text-rjb-yellow',
    blue: 'border-blue-500/25 bg-blue-500/5 text-blue-500',
    emerald: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-500'
  }

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${toneMap[tone] || toneMap.yellow}`}>
      <p className="text-xs sm:text-sm text-rjb-text/65 dark:text-rjb-text-dark/65">{title}</p>
      <p className="text-2xl sm:text-3xl font-extrabold mt-1 text-rjb-text dark:text-rjb-text-dark">{value}</p>
    </div>
  )
}

const SectionCard = ({ title, subtitle, children }) => (
  <section className="rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 backdrop-blur-sm shadow-lg overflow-hidden">
    <header className="px-5 sm:px-6 py-4 border-b border-rjb-yellow/15 bg-rjb-yellow/5">
      <h3 className="text-base sm:text-lg font-bold text-rjb-text dark:text-rjb-text-dark">{title}</h3>
      {subtitle ? <p className="text-xs sm:text-sm text-rjb-text/65 dark:text-rjb-text-dark/65 mt-0.5">{subtitle}</p> : null}
    </header>
    <div className="p-4 sm:p-6">{children}</div>
  </section>
)

const Reports = () => {
  const { user, login, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalAttachments: 0,
    recentActivity: 0
  })

  useEffect(() => {
    if (user) fetchStats()
  }, [user])

  const fetchStats = async () => {
    try {
      const [membersRes, attachmentsRes] = await Promise.all([
        api.get('/api/reports/members').catch(() => ({ data: { allMembers: [] } })),
        api.get('/api/attachments/list').catch(() => ({ data: [] }))
      ])

      setStats({
        totalMembers: membersRes.data.allMembers?.length || 0,
        totalAttachments: attachmentsRes.data?.length || 0,
        recentActivity: 0
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    if (result.success) {
      showMessage('Login bem-sucedido!')
    } else {
      showMessage(result.message || 'E-mail ou senha incorretos.', true)
    }
    setLoading(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    showMessage('Você saiu da Área Administrativa.')
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rjb-bg-light to-rjb-yellow/5 dark:from-rjb-bg-dark dark:to-rjb-yellow/5">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-rjb-yellow border-t-transparent mb-3" />
          <div className="text-base sm:text-lg text-rjb-text dark:text-rjb-text-dark">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rjb-bg-light via-rjb-bg-light/95 to-rjb-yellow/5 dark:from-rjb-bg-dark dark:via-rjb-bg-dark/95 dark:to-rjb-yellow/5 pt-16 sm:pt-20 md:pt-28 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-yellow">Área Administrativa</h1>
            <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">Acesso restrito a administradores e responsáveis.</p>
          </div>

          <SectionCard title="Entrar" subtitle="Use seu e-mail e senha para continuar.">
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
          </SectionCard>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rjb-bg-light via-rjb-bg-light/95 to-rjb-yellow/5 dark:from-rjb-bg-dark dark:via-rjb-bg-dark/95 dark:to-rjb-yellow/5 pt-16 sm:pt-20 md:pt-28 pb-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-7">
        <header className="rounded-2xl border border-rjb-yellow/20 bg-rjb-card-light/70 dark:bg-rjb-card-dark/70 shadow-lg p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-yellow">Painel Administrativo</h1>
              <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
                Gestão de convites, membros e mídia. Logado como <span className="font-semibold break-all">{user.email}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(user.role === 'financeiro' || user.role === 'admin-financeiro' || user.role === 'financeiro-view') && (
                <button
                  onClick={() => navigate('/financeiro')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors"
                >
                  Área Financeira
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-rjb-bg-light dark:bg-rjb-bg-dark border border-rjb-yellow/50 text-rjb-yellow font-semibold py-2.5 px-4 rounded-xl hover:bg-rjb-yellow/10 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" data-tour="stats">
          <StatCard title="Membros cadastrados" value={stats.totalMembers} tone="blue" />
          <StatCard title="Arquivos de mídia" value={stats.totalAttachments} tone="emerald" />
          <StatCard title="Status do sistema" value="Ativo" tone="yellow" />
        </section>

        <SectionCard title="Convites" subtitle="Gerencie chaves de convite e permissões de acesso.">
          <InvitesManagement />
        </SectionCard>

        <SectionCard title="Membros" subtitle="Consulte, filtre e administre os membros cadastrados.">
          <MembersReport />
        </SectionCard>

        <SectionCard title="Mídia do Site" subtitle="Fotos por upload e vídeos por link do YouTube.">
          <AttachmentsManagement />
        </SectionCard>
      </div>
    </div>
  )
}

export default Reports
