import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../Logo'
import Tooltip from '../Tooltip'

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [rjbDropdownOpen, setRjbDropdownOpen] = useState(false)
  const { isDark, cycleTheme, themeLabel, nextThemeLabel } = useTheme()
  const { user } = useAuth()
  const location = useLocation()

  useEffect(() => {
    // Fechar menu mobile ao mudar de página
    setMobileMenuOpen(false)
    setRjbDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    // Prevenir scroll do body quando menu está aberto
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    // Fechar menu ao clicar no overlay
    const handleOverlayClick = (event) => {
      if (mobileMenuOpen && event.target.classList.contains('mobile-menu-overlay')) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener('click', handleOverlayClick)
      return () => document.removeEventListener('click', handleOverlayClick)
    }
  }, [mobileMenuOpen])

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const subMenuRJB = {
    '/player': 'Player / Ouça nossas músicas',
    '/apresentacoes': 'Apresentações / Nossas apresentações',
    '/bastidores': 'Ensaios / Pessoas de diversos estados',
    '/repertorio': 'Repertório / Músicas originais',
    '/partituras': 'Partituras / Área Exclusiva para Músicos',
    '/fotos': 'Fotos / Fotos de apresentações',
  }

  const isRjbPage = Object.keys(subMenuRJB).some(path => location.pathname === path)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 header-rjb shadow-lg dark:shadow-black/50" data-tour="header">
      <nav className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-6 xl:space-x-8 items-center">
            <Link
              to="/"
              className={`nav-link flex items-center text-rjb-text dark:text-rjb-text-dark hover:text-rjb-yellow transition-colors font-semibold py-5 text-sm xl:text-base ${isActive('/') && 'nav-link-active'}`}
            >
              Home
            </Link>
            
            <Link
              to="/sobre"
              className={`nav-link flex items-center text-rjb-text dark:text-rjb-text-dark hover:text-rjb-yellow transition-colors font-semibold py-5 text-sm xl:text-base ${isActive('/sobre') && 'nav-link-active'}`}
            >
              Sobre
            </Link>

            {/* RJB Dropdown */}
            <div className="relative group">
              <button
                onClick={() => setRjbDropdownOpen(!rjbDropdownOpen)}
                className={`nav-link flex items-center text-rjb-text dark:text-rjb-text-dark hover:text-rjb-yellow transition-all duration-300 font-semibold py-5 text-sm xl:text-base ${isRjbPage && 'nav-link-active'}`}
              >
                A RJB
                <svg className={`ml-1 w-4 h-4 transition-transform duration-300 ${rjbDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {rjbDropdownOpen && (
                <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-56 rounded-xl shadow-2xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 ring-2 ring-rjb-yellow/30 dark:ring-rjb-yellow/50 z-50 animate-fade-in overflow-hidden">
                  <div className="py-2">
                    {[
                      { path: '/repertorio', label: 'Repertório', icon: '🎵' },
                      { path: '/partituras', label: 'Área de Partituras', icon: '🎼' },
                      { path: '/fotos', label: 'Galeria de Fotos', icon: '📸' },
                      { path: '/apresentacoes', label: 'Apresentações', icon: '🎬' },
                      { path: '/bastidores', label: 'Ensaios', icon: '🎤' }
                    ].map((item, idx) => (
                      <Link
                        key={idx}
                        to={item.path}
                        className="group/item flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-medium text-rjb-text dark:text-rjb-text-dark hover:bg-gradient-to-r hover:from-rjb-yellow hover:to-yellow-500 hover:text-rjb-text transition-all duration-300 transform hover:translate-x-1"
                        onClick={() => setRjbDropdownOpen(false)}
                      >
                        <span className="text-base group-hover/item:scale-110 transition-transform duration-300">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/player"
              className={`nav-link flex items-center text-rjb-text dark:text-rjb-text-dark hover:text-rjb-yellow transition-colors font-semibold py-5 text-sm xl:text-base ${isActive('/player') && 'nav-link-active'}`}
            >
              Player
            </Link>

            <Link
              to="/agenda"
              className={`nav-link flex items-center text-rjb-text dark:text-rjb-text-dark hover:text-rjb-yellow transition-colors font-semibold py-5 text-sm xl:text-base ${isActive('/agenda') && 'nav-link-active'}`}
            >
              Agenda
            </Link>
            
            <Link
              to="/contato"
              className={`nav-link flex items-center text-rjb-text dark:text-rjb-text-dark hover:text-rjb-yellow transition-colors font-semibold py-5 text-sm xl:text-base ${isActive('/contato') && 'nav-link-active'}`}
            >
              Contato
            </Link>
            
            <Link
              to="/relatorios"
              className={`nav-link flex items-center text-rjb-text dark:text-rjb-text-dark hover:text-rjb-yellow transition-colors font-semibold py-5 text-sm xl:text-base ${isActive('/relatorios') && 'nav-link-active'}`}
            >
              Área Administrativa
            </Link>

            {/* Tema: Sistema / Claro / Escuro */}
            <Tooltip content={`Tema: ${themeLabel} · Clique para: ${nextThemeLabel}`} position="bottom">
              <button
                onClick={cycleTheme}
                className="group relative text-rjb-text dark:text-rjb-text-dark hover:text-rjb-yellow transition-all duration-300 p-2 rounded-full hover:bg-rjb-yellow/10 focus:outline-none transform hover:scale-110 active:scale-95"
                aria-label={`Tema ${themeLabel}. Próximo: ${nextThemeLabel}`}
              >
                {isDark ? (
                  <svg className="w-5 h-5 xl:w-6 xl:h-6 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 xl:w-6 xl:h-6 group-hover:rotate-12 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </Tooltip>
          </div>

          {/* Cadastro Button - Desktop */}
          <Link
            to="/cadastro"
            className="group nav-link bg-gradient-to-r from-rjb-yellow via-yellow-500 to-yellow-500 text-rjb-text font-bold py-2 px-4 rounded-full text-xs xl:text-sm hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 hidden lg:flex items-center gap-2"
          >
            <span>Cadastro</span>
            <svg className="w-3 h-3 xl:w-4 xl:h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>

          {/* Mobile Menu Controls */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className="text-rjb-text dark:text-rjb-text-dark hover:text-rjb-yellow transition-all duration-300 p-2 rounded-md hover:bg-rjb-yellow/10 focus:outline-none transform active:scale-95"
              aria-label={`Tema ${themeLabel}. Próximo: ${nextThemeLabel}`}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setMobileMenuOpen(!mobileMenuOpen)
              }}
              className={`relative inline-flex items-center justify-center p-2.5 rounded-lg text-rjb-text dark:text-rjb-text-dark hover:text-rjb-yellow hover:bg-rjb-yellow/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-rjb-yellow transition-all duration-300 transform active:scale-95 touch-manipulation ${
                mobileMenuOpen ? 'bg-rjb-yellow/20 text-rjb-yellow' : ''
              }`}
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              <div className={`hamburger-icon ${mobileMenuOpen ? 'hamburger-open' : ''}`}>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div 
            className="mobile-menu-overlay lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed top-16 sm:top-20 left-0 right-0 z-50 mobile-menu-container bg-gradient-to-b from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 border-b-2 border-rjb-yellow/30 shadow-2xl max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="px-2 pt-4 pb-6 space-y-2">
              <Link
                to="/"
                className={`mobile-menu-item block w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${
                  isActive('/')
                    ? 'bg-gradient-to-r from-rjb-yellow/30 to-yellow-500/20 text-rjb-yellow shadow-md'
                    : 'text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/5 hover:text-rjb-yellow hover:shadow-sm'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">🏠</span>
                  <span>Home</span>
                </span>
              </Link>
              <Link
                to="/sobre"
                className={`mobile-menu-item block w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${
                  isActive('/sobre')
                    ? 'bg-gradient-to-r from-rjb-yellow/30 to-yellow-500/20 text-rjb-yellow shadow-md'
                    : 'text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/5 hover:text-rjb-yellow hover:shadow-sm'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">ℹ️</span>
                  <span>Sobre</span>
                </span>
              </Link>

              {/* Mobile RJB Dropdown */}
              <div className="relative mobile-menu-item">
                <button
                  onClick={() => setRjbDropdownOpen(!rjbDropdownOpen)}
                  className={`flex items-center justify-between w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${
                    isRjbPage
                      ? 'bg-gradient-to-r from-rjb-yellow/30 to-yellow-500/20 text-rjb-yellow shadow-md'
                      : 'text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/5 hover:text-rjb-yellow hover:shadow-sm'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">🎷</span>
                    <span>A RJB</span>
                  </span>
                  <svg className={`ml-1 w-5 h-5 transition-transform duration-300 ${rjbDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  rjbDropdownOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="mt-2 ml-4 space-y-1.5 bg-rjb-bg-light/50 dark:bg-rjb-card-dark/50 rounded-xl p-3 border border-rjb-yellow/20">
                    {[
                      { path: '/apresentacoes', label: 'Apresentações', icon: '🎬' },
                      { path: '/bastidores', label: 'Ensaios', icon: '🎤' },
                      { path: '/repertorio', label: 'Repertório', icon: '🎵' },
                      { path: '/partituras', label: 'Partituras', icon: '🎼' },
                      { path: '/fotos', label: 'Fotos', icon: '📸' }
                    ].map((item, idx) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${
                          isActive(item.path)
                            ? 'bg-rjb-yellow/30 text-rjb-yellow shadow-sm'
                            : 'text-rjb-text/90 dark:text-rjb-text-dark/90 hover:bg-rjb-yellow/20 dark:hover:bg-rjb-yellow/10 hover:text-rjb-yellow'
                        }`}
                        onClick={() => {
                          setMobileMenuOpen(false)
                          setRjbDropdownOpen(false)
                        }}
                        style={{ animationDelay: `${0.2 + idx * 0.05}s` }}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                to="/player"
                className={`mobile-menu-item block w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${
                  isActive('/player')
                    ? 'bg-gradient-to-r from-rjb-yellow/30 to-yellow-500/20 text-rjb-yellow shadow-md'
                    : 'text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/5 hover:text-rjb-yellow hover:shadow-sm'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">🎧</span>
                  <span>Player</span>
                </span>
              </Link>

              <Link
                to="/agenda"
                className={`mobile-menu-item block w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${
                  isActive('/agenda')
                    ? 'bg-gradient-to-r from-rjb-yellow/30 to-yellow-500/20 text-rjb-yellow shadow-md'
                    : 'text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/5 hover:text-rjb-yellow hover:shadow-sm'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <span>Agenda</span>
                </span>
              </Link>
              <Link
                to="/contato"
                className={`mobile-menu-item block w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${
                  isActive('/contato')
                    ? 'bg-gradient-to-r from-rjb-yellow/30 to-yellow-500/20 text-rjb-yellow shadow-md'
                    : 'text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/5 hover:text-rjb-yellow hover:shadow-sm'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">✉️</span>
                  <span>Contato</span>
                </span>
              </Link>
              <Link
                to="/cadastro"
                className="mobile-menu-item block w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-rjb-yellow via-yellow-500 to-yellow-500 text-rjb-text hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">✨</span>
                  <span>Cadastro</span>
                </span>
              </Link>
              <Link
                to="/relatorios"
                className={`mobile-menu-item block w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${
                  isActive('/relatorios')
                    ? 'bg-gradient-to-r from-rjb-yellow/30 to-yellow-500/20 text-rjb-yellow shadow-md'
                    : 'text-rjb-text dark:text-rjb-text-dark hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/5 hover:text-rjb-yellow hover:shadow-sm'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">🔐</span>
                  <span>Área Administrativa</span>
                </span>
              </Link>
              {user && (user.role === 'financeiro' || user.role === 'admin-financeiro' || user.role === 'financeiro-view') && (
                <Link
                  to="/financeiro"
                  className={`mobile-menu-item block w-full text-left px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation ${
                    isActive('/financeiro')
                      ? 'bg-gradient-to-r from-green-600/30 to-green-500/20 text-green-600 shadow-md'
                      : 'text-rjb-text dark:text-rjb-text-dark hover:bg-green-600/10 dark:hover:bg-green-600/5 hover:text-green-600 hover:shadow-sm'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">💰</span>
                    <span>Financeiro</span>
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
