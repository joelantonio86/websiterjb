import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { showMessage } from '../components/MessageBox'
import MembersReport from '../components/admin/MembersReport'
import InvitesManagement from '../components/admin/InvitesManagement'
import AttachmentsManagement from '../components/admin/AttachmentsManagement'
import api from '../services/api'

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
    if (user) {
      fetchStats()
    }
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
        recentActivity: 0 // Pode ser implementado depois
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

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-rjb-bg-light via-rjb-bg-light/95 to-rjb-yellow/5 dark:from-rjb-bg-dark dark:via-rjb-bg-dark/95 dark:to-rjb-yellow/5">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-rjb-yellow border-t-transparent mb-4"></div>
          <div className="text-xl text-rjb-text dark:text-rjb-text-dark">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rjb-bg-light via-rjb-bg-light/95 to-rjb-yellow/5 dark:from-rjb-bg-dark dark:via-rjb-bg-dark/95 dark:to-rjb-yellow/5 pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-4 sm:mb-6 animate-fade-in" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 text-xs sm:text-sm">
                <li>
                  <button onClick={() => navigate('/')} className="text-rjb-text/70 dark:text-rjb-text-dark/70 hover:text-rjb-yellow transition-colors">
                    Home
                  </button>
                </li>
                <li className="text-rjb-text/50 dark:text-rjb-text-dark/50">/</li>
                <li className="text-rjb-yellow font-medium">Área Administrativa</li>
              </ol>
            </nav>

            {/* Header */}
            <div className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-rjb-yellow/20 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:to-rjb-yellow/5 flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-rjb-yellow break-words">Área Administrativa</h2>
                  <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-xs sm:text-sm md:text-base mt-1">Gerencie convites, membros e anexos do sistema</p>
                </div>
              </div>
            </div>
            
            {/* Login Area */}
            <div className="bg-gradient-to-br from-rjb-card-light to-rjb-bg-light dark:from-rjb-card-dark dark:to-rjb-bg-dark/70 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl border-2 border-rjb-yellow/30 backdrop-blur-sm animate-fade-in hover:shadow-3xl transition-all duration-300" style={{ animationDelay: '0.2s' }}>
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-rjb-yellow/30 to-rjb-yellow/20 dark:from-rjb-yellow/20 dark:to-rjb-yellow/10 mb-3 sm:mb-4 shadow-lg">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <p className="text-rjb-text/80 dark:text-rjb-text-dark/80 text-sm sm:text-base md:text-lg font-medium px-2">Acesso restrito para regentes e administradores</p>
              </div>
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="admin-email" className="block text-xs sm:text-sm font-semibold text-rjb-text dark:text-rjb-text-dark flex items-center gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rjb-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                    </svg>
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="admin-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 sm:p-3.5 text-base rounded-lg sm:rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border-2 border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-rjb-yellow focus:border-rjb-yellow transition-all placeholder:text-rjb-text/40 hover:border-rjb-yellow/50"
                    placeholder="seu.email@exemplo.com"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label htmlFor="admin-password" className="block text-xs sm:text-sm font-semibold text-rjb-text dark:text-rjb-text-dark flex items-center gap-2">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-rjb-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                    Senha
                  </label>
                  <input
                    type="password"
                    id="admin-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 sm:p-3.5 text-base rounded-lg sm:rounded-xl bg-rjb-bg-light dark:bg-rjb-bg-dark border-2 border-rjb-yellow/30 text-rjb-text dark:text-rjb-text-dark focus:ring-2 focus:ring-rjb-yellow focus:border-rjb-yellow transition-all placeholder:text-rjb-text/40 hover:border-rjb-yellow/50"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rjb-yellow via-yellow-500 to-yellow-500 text-rjb-text font-bold py-3 sm:py-3.5 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-rjb-text border-t-transparent"></div>
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                      </svg>
                      <span>Entrar</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rjb-bg-light via-rjb-bg-light/95 to-rjb-yellow/5 dark:from-rjb-bg-dark dark:via-rjb-bg-dark/95 dark:to-rjb-yellow/5 pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-16 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header com Welcome */}
          <div className="mb-6 sm:mb-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-rjb-yellow/20 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:to-rjb-yellow/5 shadow-lg flex-shrink-0">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-rjb-yellow break-words">Área Administrativa</h2>
                    <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-xs sm:text-sm md:text-base mt-1 break-words">
                      Bem-vindo, <span className="font-semibold text-rjb-yellow break-all">{user.email}</span>
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="self-start sm:self-center bg-rjb-card-light dark:bg-rjb-card-dark border-2 border-rjb-yellow/50 text-rjb-yellow font-bold py-2 sm:py-2.5 px-4 sm:px-5 rounded-lg sm:rounded-xl hover:bg-rjb-yellow/10 hover:border-rjb-yellow transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-xs sm:text-sm touch-manipulation whitespace-nowrap"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                Sair
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8" data-tour="stats">
              <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/10 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-blue-500/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-rjb-text/70 dark:text-rjb-text-dark/70 mb-1">Total de Membros</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalMembers}</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg bg-blue-500/20 dark:bg-blue-500/30 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent dark:from-green-500/20 dark:via-green-500/10 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-green-500/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-rjb-text/70 dark:text-rjb-text-dark/70 mb-1">Anexos</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalAttachments}</p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-lg bg-green-500/20 dark:bg-green-500/30 flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-500/20 dark:via-purple-500/10 rounded-lg sm:rounded-xl p-4 sm:p-5 border border-purple-500/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in sm:col-span-2 lg:col-span-1" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-rjb-text/70 dark:text-rjb-text-dark/70 mb-1">Sistema</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">Ativo</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/20 dark:bg-purple-500/30">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Link para Área Financeira */}
          {(user.role === 'financeiro' || user.role === 'admin-financeiro' || user.role === 'financeiro-view') && (
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <button
                onClick={() => navigate('/financeiro')}
                className="group w-full sm:w-auto inline-flex items-center gap-3 bg-gradient-to-r from-green-600 via-green-600 to-green-700 hover:from-green-700 hover:via-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Área Financeira</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          )}

          {/* Admin Dashboard Area */}
          <div className="space-y-6">
            {/* Gerenciamento de Convites */}
            <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <InvitesManagement />
            </div>

            {/* Gerenciamento de Membros */}
            <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <MembersReport />
            </div>

            {/* Gerenciamento de Anexos */}
            <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <AttachmentsManagement />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
