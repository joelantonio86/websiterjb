import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'

const FOUNDATION_YEAR = 2015

const MISSAO_ITEMS = [
  'Promover a Cultura Racional através da arte musical.',
  'Desenvolver e executar um repertório instrumental de excelência.',
  'Inspirar o raciocínio, o equilíbrio e a paz no público.',
]

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

  const yearsActive = useMemo(() => new Date().getFullYear() - FOUNDATION_YEAR, [])

  return (
    <PageWrapper title="Sobre a RJB">
      <div className={`max-w-5xl mx-auto text-rjb-text dark:text-rjb-text-dark transition-all ${motionDuration} ${isVisible ? motionEnter : motionExit}`}>
        {/* Badge de origem — data e local de fundação */}
        <section className="mb-10 sm:mb-14 text-center px-2 sm:px-4" aria-label="Origem">
          {/* Mobile (< xs): 2 pílulas empilhadas — texto curto por linha */}
          <div className="flex flex-col xs:hidden items-center gap-2">
            <span className="inline-block px-4 py-1.5 rounded-full border border-rjb-yellow/40 bg-rjb-yellow/5 text-[11px] font-semibold uppercase tracking-widest text-rjb-text-muted dark:text-rjb-text-muted-dark">
              Fundada em 20/11/{FOUNDATION_YEAR}
            </span>
            <span className="inline-block px-4 py-1.5 rounded-full border border-rjb-yellow/40 bg-rjb-yellow/5 text-[11px] font-semibold uppercase tracking-widest text-rjb-text-muted dark:text-rjb-text-muted-dark">
              Nova Iguaçu, RJ
            </span>
          </div>
          {/* xs+ (≥ 480px): pílula única em linha */}
          <div className="hidden xs:inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 rounded-full border border-rjb-yellow/40 bg-rjb-yellow/5 text-xs sm:text-sm font-semibold uppercase tracking-widest text-rjb-text-muted dark:text-rjb-text-muted-dark">
            <span>Fundada em 20 de novembro de {FOUNDATION_YEAR}</span>
            <span aria-hidden className="text-rjb-yellow">•</span>
            <span>Nova Iguaçu, RJ</span>
          </div>
        </section>

        {/* Stats — anos de trajetória + próxima apresentação */}
        <section
          className="mb-12 sm:mb-16 grid grid-cols-2 gap-4 md:gap-8 py-6 sm:py-8 border-y border-rjb-border-light dark:border-rjb-border-dark"
          aria-label="Números da RJB"
        >
          {[
            { value: yearsActive, label: yearsActive === 1 ? 'ano de trajetória' : 'anos de trajetória' },
            { value: 1, label: 'apresentação em maio/2026' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="font-serif font-semibold text-4xl sm:text-5xl md:text-6xl text-rjb-gold leading-none tabular-nums" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}>
                {stat.value}
              </p>
              <p className="mt-2 text-[10px] sm:text-xs md:text-sm text-rjb-text-muted dark:text-rjb-text-muted-dark uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        {/* Seção 1 — A Expressão Musical do Saber */}
        <section id="expressao" className="mb-12 sm:mb-16 grid md:grid-cols-[auto_1fr] gap-6 md:gap-10" aria-labelledby="expressao-heading">
          <div className="md:sticky md:top-24 md:self-start">
            <p className="text-xs font-bold uppercase tracking-widest text-rjb-yellow mb-1">Capítulo I</p>
            <h2 id="expressao-heading" className="font-serif tracking-tight text-3xl sm:text-4xl md:text-5xl font-semibold text-rjb-gold leading-[1.05]" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}>
              A Expressão<br />Musical do Saber
            </h2>
          </div>
          <div className="space-y-4 sm:space-y-5 text-rjb-text/85 dark:text-rjb-text-dark/85 leading-relaxed text-base sm:text-lg">
            <p className="first-letter:font-serif first-letter:text-5xl sm:first-letter:text-6xl first-letter:font-semibold first-letter:text-rjb-gold first-letter:float-left first-letter:leading-none first-letter:mr-2 first-letter:mt-1">
              A <strong className="text-rjb-gold font-semibold">Racional Jazz Band (RJB)</strong> nasceu da união de dois propósitos elevados: a excelência artística do Jazz e a profundidade da <strong className="text-rjb-gold font-semibold">Cultura Racional</strong>. Fundada em <strong className="text-rjb-gold font-semibold">20 de novembro de 2015</strong>, a RJB rapidamente se estabeleceu como um veículo de expressão para um conhecimento que transcende, utilizando a música como sua linguagem universal.
            </p>
            <p>
              Acreditamos que a música instrumental é a forma mais pura de comunicação. O Jazz, com sua liberdade rítmica e improvisação harmoniosa, oferece o palco ideal para manifestar os sentimentos de equilíbrio, paz e raciocínio que a Cultura Racional propaga. Cada apresentação é um convite à reflexão e à harmonia.
            </p>
          </div>
        </section>

        {/* Seção 2 — O Conceito Racional */}
        <section id="conceito" className="mb-12 sm:mb-16 grid md:grid-cols-[auto_1fr] gap-6 md:gap-10" aria-labelledby="conceito-heading">
          <div className="md:sticky md:top-24 md:self-start">
            <p className="text-xs font-bold uppercase tracking-widest text-rjb-yellow mb-1">Capítulo II</p>
            <h2 id="conceito-heading" className="font-serif tracking-tight text-3xl sm:text-4xl md:text-5xl font-semibold text-rjb-gold leading-[1.05]" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}>
              O Conceito<br />Racional
            </h2>
          </div>
          <div className="space-y-4 sm:space-y-5 text-rjb-text/85 dark:text-rjb-text-dark/85 leading-relaxed text-base sm:text-lg">
            <p>
              A Cultura Racional é o conhecimento que revela a origem e o destino de tudo e de todos, promovendo o raciocínio, o equilíbrio e a ligação com o Mundo de Energia Racional. Nossa missão não é apenas performar; é <strong className="text-rjb-gold font-semibold">transmitir essa mensagem de Luz e de Paz</strong> através de arranjos exclusivos e composições inspiradas nos pilares da Cultura.
            </p>
            <p>
              Cada apresentação, cada nota e cada melodia da RJB é um convite para o público refletir sobre sua essência e o universo que o cerca, encontrando a harmonia entre o macrocosmo e o próprio ser.
            </p>
          </div>
        </section>

        {/* Seção 3 — Nossa Missão */}
        <section id="missao" className="mb-12 sm:mb-16 grid md:grid-cols-[auto_1fr] gap-6 md:gap-10" aria-labelledby="missao-heading">
          <div className="md:sticky md:top-24 md:self-start">
            <p className="text-xs font-bold uppercase tracking-widest text-rjb-yellow mb-1">Capítulo III</p>
            <h2 id="missao-heading" className="font-serif tracking-tight text-3xl sm:text-4xl md:text-5xl font-semibold text-rjb-gold leading-[1.05]" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}>
              Nossa<br />Missão
            </h2>
          </div>
          <ul className="space-y-3 sm:space-y-4">
            {MISSAO_ITEMS.map((item, i) => (
              <li
                key={i}
                className="group flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-rjb-card-light dark:bg-rjb-card-dark border border-rjb-border-light dark:border-rjb-border-dark hover:border-rjb-yellow/50 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <span aria-hidden className="flex-shrink-0 font-serif text-2xl sm:text-3xl font-semibold text-rjb-gold leading-none w-10 sm:w-12 tabular-nums" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}>
                  0{i + 1}
                </span>
                <p className="flex-1 text-base sm:text-lg text-rjb-text/85 dark:text-rjb-text-dark/85 leading-relaxed">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA final */}
        <section
          className="mt-12 sm:mt-16 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-rjb-yellow/15 via-rjb-yellow/8 to-transparent dark:from-rjb-yellow/20 dark:via-rjb-yellow/10 dark:to-transparent border-2 border-rjb-yellow/30 text-center shadow-xl"
          aria-labelledby="cta-heading"
        >
          <h3 id="cta-heading" className="font-serif tracking-tight text-2xl sm:text-3xl md:text-4xl font-semibold text-rjb-text dark:text-rjb-text-dark mb-3" style={{ fontVariationSettings: '"opsz" 96, "SOFT" 40' }}>
            Sinta a música. Viva o saber.
          </h3>
          <p className="text-sm sm:text-base md:text-lg text-rjb-text/75 dark:text-rjb-text-dark/75 max-w-2xl mx-auto mb-6">
            Explore o repertório, conheça a agenda de shows ou entre em contato conosco.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/player"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-rjb-yellow text-rjb-text font-bold text-sm sm:text-base hover:bg-yellow-500 transition-colors shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              aria-label="Ouça nossas músicas no player"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>
              Ouça nossas músicas
            </Link>
            <Link
              to="/apresentacoes"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-rjb-yellow/60 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm sm:text-base hover:bg-rjb-yellow/15 dark:hover:bg-rjb-yellow/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              aria-label="Ver apresentações da banda"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              Ver apresentações
            </Link>
            <Link
              to="/contato"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-rjb-yellow/60 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm sm:text-base hover:bg-rjb-yellow/15 dark:hover:bg-rjb-yellow/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              aria-label="Entrar em contato"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Falar conosco
            </Link>
          </div>
        </section>
      </div>
    </PageWrapper>
  )
}

export default Sobre
