import { useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

const PageWrapper = ({ title, subtitle, children }) => {
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  
  const subMenuRJB = {
    '/player': 'Player / Ouça nossas músicas',
    '/apresentacoes': 'Apresentações / Nossas apresentações',
    '/bastidores': 'Ensaios / Pessoas de diversos estados',
    '/repertorio': 'Repertório / Músicas originais',
    '/partituras': 'Partituras / Área Exclusiva para Músicos',
    '/fotos': 'Fotos / Fotos de apresentações',
  }

  useEffect(() => {
    setIsVisible(false)
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const pageTitle = subtitle || subMenuRJB[location.pathname] || title || 'Página'
  const mainTitle = pageTitle.split('/')[0].trim()
  const subTitle = pageTitle.includes('/') ? pageTitle.split('/')[1].trim() : null

  return (
    <div className="relative pt-4 sm:pt-6 md:pt-8 pb-12 sm:pb-16 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`text-center mb-6 sm:mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold rjb-logo-text text-rjb-yellow mb-2 sm:mb-3 break-words px-2 leading-tight">
          {mainTitle}
        </h1>
        {subTitle && (
          <p className="text-base sm:text-lg md:text-xl dark:text-rjb-text-dark/70 text-rjb-text/70 mb-6 sm:mb-8 transition-all duration-700 delay-200 px-2">
            {subTitle}
          </p>
        )}
      </div>
      
      <div className={`relative bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 p-4 sm:p-6 md:p-8 lg:p-10 rounded-xl sm:rounded-2xl shadow-2xl dark:shadow-3xl dark:shadow-black/30 z-10 border border-rjb-yellow/10 backdrop-blur-sm transition-all duration-700 delay-300 text-rjb-text dark:text-rjb-text-dark ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        {children}
      </div>
    </div>
  )
}

export default PageWrapper
