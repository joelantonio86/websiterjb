import { Link, useLocation } from 'react-router-dom'

const Breadcrumbs = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  const getBreadcrumbName = (pathname) => {
    const names = {
      '': 'Home',
      sobre: 'Sobre',
      apresentacoes: 'Apresentações',
      bastidores: 'Ensaios',
      player: 'Músicas',
      repertorio: 'Músicas',
      'repertorio-apresentacoes': 'Repertório 2026',
      partituras: 'Partituras',
      fotos: 'Fotos',
      agenda: 'Agenda',
      contato: 'Contato',
      cadastro: 'Cadastro',
      relatorios: 'Área Administrativa',
      financeiro: 'Financeiro'
    }
    return names[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1)
  }

  if (pathnames.length === 0) {
    return null
  }

  return (
    <nav className="mb-4 sm:mb-6 animate-fade-in" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-xs sm:text-sm flex-wrap">
        <li>
          <Link
            to="/"
            className="text-rjb-text/70 dark:text-rjb-text-dark/70 hover:text-rjb-yellow transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`
          const isLast = index === pathnames.length - 1

          return (
            <li key={to} className="flex items-center">
              <span className="text-rjb-text/30 dark:text-rjb-text-dark/30 mx-2">/</span>
              {isLast ? (
                <span className="text-rjb-yellow font-semibold">{getBreadcrumbName(value)}</span>
              ) : (
                <Link
                  to={to}
                  className="text-rjb-text/70 dark:text-rjb-text-dark/70 hover:text-rjb-yellow transition-colors"
                >
                  {getBreadcrumbName(value)}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
