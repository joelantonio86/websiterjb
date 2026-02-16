import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

const Sobre = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    document.title = 'Sobre — Racional Jazz Band'
    setIsVisible(true)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const motionDuration = reducedMotion ? 'duration-300' : 'duration-700'
  const motionEnter = 'opacity-100 translate-y-0'
  const motionExit = reducedMotion ? 'opacity-0' : 'opacity-0 translate-y-5'

  return (
    <PageWrapper title="Sobre a RJB">
      <div className={`max-w-4xl mx-auto space-y-6 sm:space-y-8 text-rjb-text dark:text-rjb-text-dark transition-all ${motionDuration} ${isVisible ? motionEnter : motionExit}`}>
        <section id="expressao" className="relative" aria-labelledby="expressao-heading">
          <h2 id="expressao-heading" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-yellow border-b-2 border-rjb-yellow/50 pb-2 sm:pb-3 inline-block">
            A Expressão Musical do Saber
          </h2>
        </section>

        <div className="relative border-l-4 border-rjb-yellow pl-4 sm:pl-6 pr-3 sm:pr-4 py-4 sm:py-5 bg-gradient-to-r from-rjb-yellow/5 via-rjb-yellow/5 to-transparent dark:from-rjb-yellow/10 dark:via-rjb-yellow/5 dark:to-transparent rounded-r-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute -left-2 top-5 sm:top-6 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-rjb-yellow border-2 border-rjb-bg-light dark:border-rjb-bg-dark shadow-lg"></div>
          <p className="text-base sm:text-lg md:text-xl font-medium italic text-rjb-text/90 dark:text-rjb-text-dark/90 leading-relaxed">
            A <strong className="text-rjb-yellow">Racional Jazz Band (RJB)</strong> nasceu da união de dois propósitos elevados: a excelência artística do Jazz e a profundidade da <strong className="text-rjb-yellow">Cultura Racional</strong>. Fundada em <strong className="text-rjb-yellow">20 de novembro de 2015</strong>, a RJB rapidamente se estabeleceu como um veículo de expressão para um conhecimento que transcende, utilizando a música como sua linguagem universal.
          </p>
        </div>

        <div className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
          <p className="text-rjb-text/80 dark:text-rjb-text-dark/80 leading-relaxed text-sm sm:text-base md:text-lg">
            Acreditamos que a música instrumental é a forma mais pura de comunicação. O Jazz, com sua liberdade rítmica e improvisação harmoniosa, oferece o palco ideal para manifestar os sentimentos de equilíbrio, paz e raciocínio que a Cultura Racional propaga. Cada apresentação é um convite à reflexão e à harmonia.
          </p>
        </div>
        
        <section id="conceito" className="relative mt-8 sm:mt-10 pt-6 sm:pt-8 border-t-2 border-rjb-yellow/20" aria-labelledby="conceito-heading">
          <h3 id="conceito-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-rjb-text dark:text-rjb-text-dark mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-rjb-yellow to-yellow-500 rounded-full" aria-hidden></div>
            <span>O Conceito Racional</span>
          </h3>

          <div className="space-y-3 sm:space-y-4 text-rjb-text/80 dark:text-rjb-text-dark/80 leading-relaxed text-sm sm:text-base md:text-lg">
            <p>
              A Cultura Racional é o conhecimento que revela a origem e o destino de tudo e de todos, promovendo o raciocínio, o equilíbrio e a ligação com o Mundo de Energia Racional. Nossa missão não é apenas performar; é <strong className="text-rjb-yellow font-semibold">transmitir essa mensagem de Luz e de Paz</strong> através de arranjos exclusivos e composições inspiradas nos pilares da Cultura.
            </p>
            
            <p>
              Cada apresentação, cada nota e cada melodia da RJB é um convite para o público refletir sobre sua essência e o universo que o cerca, encontrando a harmonia entre o macrocosmo e o próprio ser.
            </p>
          </div>
        </section>

        <section id="missao" className="mt-8 sm:mt-12 p-5 sm:p-6 md:p-8 bg-gradient-to-br from-rjb-yellow/10 via-rjb-yellow/5 to-transparent dark:from-rjb-yellow/20 dark:via-rjb-yellow/10 dark:to-transparent rounded-xl sm:rounded-2xl border-2 border-rjb-yellow/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.01]" aria-labelledby="missao-heading">
          <h3 id="missao-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-rjb-text dark:text-rjb-text-dark mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-rjb-yellow/30 to-rjb-yellow/20 dark:from-rjb-yellow/20 dark:to-rjb-yellow/10">
              <svg className="w-5 h-5 sm:w-6 sm:h-7 md:w-7 md:h-7 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span>Nossa Missão</span>
          </h3>
          <ul className="space-y-2 sm:space-y-3 text-rjb-text/80 dark:text-rjb-text-dark/80 text-sm sm:text-base md:text-lg">
            {[
              'Promover a Cultura Racional através da arte musical.',
              'Desenvolver e executar um repertório instrumental de excelência.',
              'Inspirar o raciocínio, o equilíbrio e a paz no público.'
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-2 sm:gap-3 group">
                <div className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rjb-yellow group-hover:scale-150 transition-transform duration-300"></div>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <nav className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-stone-200 dark:border-stone-600/60" aria-label="Próximos passos">
          <p className="text-sm font-semibold text-rjb-text/70 dark:text-rjb-text-dark/70 mb-4">Explore mais</p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link
              to="/player"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rjb-yellow/15 dark:bg-rjb-yellow/10 border border-rjb-yellow/40 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm sm:text-base hover:bg-rjb-yellow/25 dark:hover:bg-rjb-yellow/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              aria-label="Ouça nossas músicas no player"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
              Ouça nossas músicas
            </Link>
            <Link
              to="/apresentacoes"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-rjb-yellow/50 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm sm:text-base hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              aria-label="Ver apresentações da banda"
            >
              Ver apresentações
            </Link>
            <Link
              to="/player"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-rjb-yellow/50 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm sm:text-base hover:bg-rjb-yellow/10 dark:hover:bg-rjb-yellow/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              aria-label="Ouça o repertório na página Músicas"
            >
              Ouça o repertório
            </Link>
          </div>
        </nav>
      </div>
    </PageWrapper>
  )
}

export default Sobre
