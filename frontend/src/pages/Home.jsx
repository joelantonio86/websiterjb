import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrazilMap from '../components/BrazilMap'

const Home = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <>
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden px-4">
        <div className="relative z-10 max-w-7xl mx-auto w-full text-center">
          <div className={`text-center pt-8 sm:pt-12 pb-16 sm:pb-24 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h1 className={`text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-mono rjb-logo-text text-rjb-yellow mb-3 sm:mb-4 transition-all duration-1000 delay-200 leading-tight ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              Racional Jazz Band
            </h1>
            <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-rjb-text dark:text-rjb-text-dark mb-4 sm:mb-6 px-2 transition-all duration-1000 delay-300 leading-tight ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              Música, Arte e Cultura Racional
            </h2>
            <p className={`text-sm sm:text-base md:text-lg lg:text-xl text-rjb-text/80 dark:text-rjb-text-dark/80 mb-6 sm:mb-10 max-w-4xl mx-auto px-2 leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
              A Racional Jazz Band é a expressão musical do conhecimento Racional, unindo a força do jazz, a beleza da melodia e a pureza de um saber que transcende.
            </p>
            <div className={`flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 transition-all duration-1000 delay-500 px-4 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`} data-tour="hero-buttons">
              <button
                onClick={() => navigate('/apresentacoes')}
                className="group relative bg-gradient-to-r from-rjb-yellow via-yellow-500 to-yellow-500 text-rjb-text font-bold py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl overflow-hidden w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Ver Apresentações
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <button
                onClick={() => navigate('/sobre')}
                className="group bg-transparent border-2 border-rjb-yellow text-rjb-text dark:text-rjb-text-dark font-bold py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-rjb-yellow/20 dark:hover:bg-rjb-yellow/10 hover:border-yellow-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Conheça a História
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Mapa: componentes por estado */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-20" aria-labelledby="mapa-brasil-title">
        <div className="text-center mb-8 sm:mb-10">
          <h2 id="mapa-brasil-title" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-text dark:text-rjb-text-dark mb-2">
            Componentes por estado
          </h2>
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 max-w-2xl mx-auto">
            A Racional Jazz Band reúne componentes de diversos estados do Brasil. Passe o mouse sobre um estado para ver a quantidade.
          </p>
        </div>
        <BrazilMap />
      </section>
      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20 -mt-4 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6h.01M21 3h.01"></path>
              ),
              title: 'Música Instrumental',
              description: 'A harmonia perfeita entre os instrumentos e o saber.'
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8l4-2 4 2V7m0 8a2 2 0 11-4 0 2 2 0 014 0zM12 11c0 1.657-1.343 3-3 3H5a2 2 0 01-2-2v-3a2 2 0 012-2h4a2 2 0 012 2v1zM21 17a2 2 0 01-2 2h-5m-7-2a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v5"></path>
              ),
              title: 'Repertório Único',
              description: 'Composições próprias e arranjos exclusivos da cultura Racional.'
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              ),
              title: 'Compromisso Cultural',
              description: 'Divulgando a Cultura Racional em eventos e apresentações.'
            }
          ].map((card, index) => (
            <div
              key={index}
              className="group relative p-5 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/95 to-rjb-card-light/90 dark:from-rjb-card-dark dark:via-rjb-card-dark/95 dark:to-rjb-card-dark/90 shadow-xl dark:shadow-2xl dark:shadow-black/50 border-t-4 border-rjb-yellow/70 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-rjb-yellow animate-fade-in"
              style={{ animationDelay: `${600 + index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rjb-yellow/0 to-rjb-yellow/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-rjb-yellow/20 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:to-rjb-yellow/5 mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {card.icon}
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 text-rjb-text dark:text-rjb-text-dark group-hover:text-rjb-yellow transition-colors duration-300">
                  {card.title}
                </h3>
                <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default Home
