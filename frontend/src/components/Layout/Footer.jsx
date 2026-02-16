import { useNavigate } from 'react-router-dom'

const Footer = () => {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative bg-gradient-to-b from-rjb-card-light via-rjb-card-light/95 to-rjb-card-light/90 dark:from-rjb-card-dark dark:via-rjb-card-dark/95 dark:to-rjb-card-dark/90 border-t-2 border-rjb-yellow/20 mt-8 sm:mt-12 py-8 sm:py-10 md:py-12 safe-area-inset-bottom z-20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-center md:text-left">
            <div className="rjb-logo-text text-xl sm:text-2xl md:text-3xl font-mono font-extrabold text-rjb-yellow mb-1 sm:mb-2">
              RJB
            </div>
            <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-xs sm:text-sm md:text-base">
              Racional Jazz Band © {currentYear}. Todos os direitos reservados.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm md:text-base">
            <button
              onClick={() => navigate('/sobre')}
              className="group min-h-[44px] inline-flex items-center px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-lg hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/5 text-rjb-text/60 dark:text-rjb-text-dark/60 hover:text-rjb-yellow transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                Política de Privacidade
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </span>
            </button>
            <span className="text-rjb-text/30 dark:text-rjb-text-dark/30 hidden sm:inline">•</span>
            <button
              onClick={() => navigate('/contato')}
              className="group min-h-[44px] inline-flex items-center px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-lg hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/5 text-rjb-text/60 dark:text-rjb-text-dark/60 hover:text-rjb-yellow transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                Termos de Uso
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </span>
            </button>
            <span className="text-rjb-text/30 dark:text-rjb-text-dark/30 hidden sm:inline">•</span>
            <button
              onClick={() => navigate('/cadastro')}
              className="group min-h-[44px] inline-flex items-center px-4 sm:px-3 py-2.5 sm:py-1.5 rounded-lg hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/5 text-rjb-text/60 dark:text-rjb-text-dark/60 hover:text-rjb-yellow transition-all duration-300 transform hover:scale-105 active:scale-95 touch-manipulation"
            >
              <span className="flex items-center gap-1 sm:gap-1.5">
                Trabalhe Conosco
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
