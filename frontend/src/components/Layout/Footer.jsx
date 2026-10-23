import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinkClass = 'min-h-[44px] inline-flex items-center text-sm text-rjb-text/80 dark:text-rjb-text-dark/80 hover:text-rjb-gold transition-colors'

  return (
    <footer className="relative bg-rjb-card-light dark:bg-rjb-card-dark border-t border-rjb-yellow/50 mt-8 sm:mt-12 safe-area-inset-bottom z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-oud.jpg"
              alt=""
              className="h-12 w-12 rounded-full object-cover ring-1 ring-rjb-yellow/80"
            />
            <div>
              <p className="font-serif text-lg font-semibold tracking-[0.08em] text-rjb-text dark:text-rjb-text-dark leading-none">
                OUD
              </p>
              <p className="mt-1 text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
                Orquestra Universo em Desencanto
              </p>
            </div>
          </div>

          <nav aria-label="Rodapé" className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
            <Link to="/politica-privacidade" className={footerLinkClass}>
              Política de Privacidade
            </Link>
            <Link to="/termos-uso" className={footerLinkClass}>
              Termos de Uso
            </Link>
            <Link to="/cadastro" className={footerLinkClass}>
              Faça parte da OUD
            </Link>
          </nav>
        </div>

        <p className="mt-6 pt-4 border-t border-rjb-yellow/30 text-xs sm:text-sm text-rjb-text/60 dark:text-rjb-text-dark/60">
          © {currentYear} Orquestra Universo em Desencanto. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}

export default Footer
