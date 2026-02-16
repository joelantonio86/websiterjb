import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import BrazilMap from '../components/BrazilMap'
import StageRoster from '../components/StageRoster'
import { AGENDA_EVENTS } from '../data/events'
import { APRESENTACOES_BY_EVENT } from '../data/videos'
import { racionais, diversas } from '../data/songs'

const Home = () => {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    document.title = 'Racional Jazz Band — Música, Arte e Cultura'
    setIsVisible(true)
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const motion = reducedMotion
    ? { duration: 'duration-300', enter: 'opacity-100 translate-y-0 scale-100', enterAlt: 'opacity-100 translate-y-0' }
    : { duration: 'duration-1000', enter: 'opacity-100 scale-100', enterAlt: 'opacity-100 translate-y-0' }
  const exit = reducedMotion ? 'opacity-0' : 'opacity-0 translate-y-10'
  const exitScale = reducedMotion ? 'opacity-0' : 'opacity-0 scale-95'
  const exitY = reducedMotion ? 'opacity-0' : 'opacity-0 translate-y-5'

  const [featuredVideoModalOpen, setFeaturedVideoModalOpen] = useState(false)
  const featuredVideoCloseRef = useRef(null)
  const [totalComponents, setTotalComponents] = useState(null)
  const totalSongs = racionais.length + diversas.length
  const nextShowsCount = AGENDA_EVENTS.filter(e => e.date.startsWith('2026')).length
  const featuredVideo = useMemo(() => {
    const sorted = [...APRESENTACOES_BY_EVENT].sort((a, b) => new Date(b.date) - new Date(a.date))
    const event = sorted[0]
    if (!event?.videos?.length) return null
    return { ...event.videos[0], eventTitle: event.eventTitle, dateFormatted: event.dateFormatted }
  }, [])

  useEffect(() => {
    if (!featuredVideoModalOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    featuredVideoCloseRef.current?.focus()
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setFeaturedVideoModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [featuredVideoModalOpen])

  return (
    <>
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden px-4" id="hero">
        <div className="relative z-10 max-w-7xl mx-auto w-full text-center">
          <div className={`text-center pt-8 sm:pt-12 pb-16 sm:pb-24 transition-all ${motion.duration} ${isVisible ? `opacity-100 translate-y-0 ${motion.enterAlt}` : exit}`}>
            <h1 className={`text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-mono rjb-logo-text text-rjb-yellow mb-3 sm:mb-4 transition-all ${motion.duration} ${reducedMotion ? '' : 'delay-200'} leading-tight ${isVisible ? motion.enter : exitScale}`}>
              Racional Jazz Band
            </h1>
            <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-rjb-text dark:text-rjb-text-dark mb-4 sm:mb-6 px-2 transition-all ${motion.duration} ${reducedMotion ? '' : 'delay-300'} leading-tight ${isVisible ? motion.enterAlt : exitY}`}>
              Música, Arte e Cultura Racional
            </h2>
            <p className={`text-sm sm:text-base md:text-lg lg:text-xl text-rjb-text/80 dark:text-rjb-text-dark/80 mb-6 sm:mb-10 max-w-4xl mx-auto px-2 leading-relaxed transition-all ${motion.duration} ${reducedMotion ? '' : 'delay-400'} ${isVisible ? motion.enterAlt : exitY}`}>
              A Racional Jazz Band é a expressão musical do conhecimento Racional, unindo a força do jazz, a beleza da melodia e a pureza de um saber que transcende.
            </p>
            <div className={`flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 transition-all ${motion.duration} ${reducedMotion ? '' : 'delay-500'} px-4 ${isVisible ? motion.enterAlt : exitY}`} data-tour="hero-buttons">
              <button
                onClick={() => navigate('/apresentacoes')}
                className="group relative bg-gradient-to-r from-rjb-yellow via-yellow-500 to-yellow-500 text-rjb-text font-bold py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl overflow-hidden w-full sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
                aria-label="Ver apresentações da banda"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Ver Apresentações
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden />
              </button>
              <button
                onClick={() => navigate('/sobre')}
                className="group bg-transparent border-2 border-rjb-yellow text-rjb-text dark:text-rjb-text-dark font-bold py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-rjb-yellow/20 dark:hover:bg-rjb-yellow/10 hover:border-yellow-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg w-full sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
                aria-label="Conhecer a história da banda"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Conheça a História
                </span>
              </button>
              <button
                onClick={() => navigate('/player')}
                className="group bg-transparent border-2 border-rjb-yellow text-rjb-text dark:text-rjb-text-dark font-bold py-3 px-6 sm:px-8 rounded-full text-base sm:text-lg hover:bg-rjb-yellow/20 dark:hover:bg-rjb-yellow/10 hover:border-yellow-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg w-full sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
                aria-label="Ouça nossas músicas no player"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                  </svg>
                  Ouça nossas músicas
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Próximas apresentações */}
      <section id="proximas-apresentacoes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-20" aria-labelledby="proximas-title">
        <div className="text-center mb-8 sm:mb-10">
          <h2 id="proximas-title" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-text dark:text-rjb-text-dark mb-2">
            Próximas apresentações
          </h2>
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 max-w-2xl mx-auto">
            Confira as datas de 2026 e o repertório previsto para cada apresentação.
          </p>
        </div>
        <div className="space-y-3 sm:space-y-4 mb-8">
          {AGENDA_EVENTS.slice(0, 3).map((event, index) => {
            const [day, month, year] = event.dateString.split(' ')
            return (
              <div
                key={event.date}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 border-l-4 border-rjb-yellow shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex-shrink-0 inline-flex flex-col items-center sm:items-start p-2.5 sm:p-3 bg-rjb-yellow/15 dark:bg-rjb-yellow/10 rounded-lg border border-rjb-yellow/30">
                  <span className="text-2xl font-extrabold text-rjb-yellow leading-none">{day}</span>
                  <span className="text-xs font-bold text-rjb-text dark:text-rjb-text-dark uppercase">{month}</span>
                  <span className="text-xs text-rjb-text/70 dark:text-rjb-text-dark/70">{year}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-rjb-text dark:text-rjb-text-dark">{event.title}</h3>
                  <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">{event.location} · {/^\d{1,2}:\d{2}$/.test(event.time) ? `${event.time}h` : event.time}</p>
                </div>
                <Link
                  to={event.link || '/agenda'}
                  className="flex-shrink-0 text-sm font-semibold text-rjb-yellow hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded"
                >
                  Ver repertório →
                </Link>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/agenda"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rjb-yellow/20 dark:bg-rjb-yellow/10 border border-rjb-yellow/40 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm hover:bg-rjb-yellow/30 dark:hover:bg-rjb-yellow/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
          >
            Ver agenda completa
          </Link>
          <Link
            to="/repertorio-apresentacoes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rjb-yellow/20 dark:bg-rjb-yellow/10 border border-rjb-yellow/40 text-rjb-text dark:text-rjb-text-dark font-semibold text-sm hover:bg-rjb-yellow/30 dark:hover:bg-rjb-yellow/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
          >
            Repertório 2026
          </Link>
        </div>
      </section>

      {/* Para músicos */}
      <section id="para-musicos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-20 bg-gradient-to-b from-rjb-yellow/5 to-transparent dark:from-rjb-yellow/5 dark:to-transparent rounded-3xl" aria-labelledby="para-musicos-title">
        <div className="text-center mb-8 sm:mb-10">
          <h2 id="para-musicos-title" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-text dark:text-rjb-text-dark mb-2">
            Para músicos
          </h2>
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 max-w-2xl mx-auto">
            Partituras, repertório das apresentações e músicas para estudar em casa.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { to: '/partituras', icon: '🎼', title: 'Partituras', description: 'Área exclusiva com partituras do repertório.' },
            { to: '/repertorio-apresentacoes', icon: '📋', title: 'Repertório 2026', description: 'Músicas previstas para cada apresentação do ano.' },
            { to: '/player', icon: '🎵', title: 'Músicas', description: 'Ouça e estude o repertório completo.' },
          ].map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col p-5 sm:p-6 rounded-2xl bg-rjb-card-light dark:bg-rjb-card-dark shadow-xl border border-rjb-yellow/20 hover:border-rjb-yellow/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
            >
              <span className="text-3xl sm:text-4xl mb-3 block" aria-hidden="true">{item.icon}</span>
              <h3 className="text-lg sm:text-xl font-bold text-rjb-text dark:text-rjb-text-dark mb-1 group-hover:text-rjb-yellow transition-colors">{item.title}</h3>
              <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 flex-grow">{item.description}</p>
              <span className="text-sm font-semibold text-rjb-yellow mt-3 inline-flex items-center gap-1">
                Acessar <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Vídeo em destaque */}
      {featuredVideo && (
        <section id="destaque-video" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-20" aria-labelledby="destaque-video-title">
          <div className="text-center mb-6 sm:mb-8">
            <h2 id="destaque-video-title" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-text dark:text-rjb-text-dark mb-2">
              Assista em destaque
            </h2>
            <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 max-w-2xl mx-auto">
              Uma amostra do que a RJB leva ao palco.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFeaturedVideoModalOpen(true)}
            className="group w-full text-left block rounded-2xl overflow-hidden shadow-2xl border-2 border-rjb-yellow/20 hover:border-rjb-yellow/50 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
          >
            <div className="relative aspect-video bg-stone-900">
              <img
                src={`https://img.youtube.com/vi/${featuredVideo.id}/maxresdefault.jpg`}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-rjb-yellow ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-5 bg-rjb-card-light dark:bg-rjb-card-dark">
              <h3 className="font-bold text-lg text-rjb-text dark:text-rjb-text-dark group-hover:text-rjb-yellow transition-colors">{featuredVideo.title}</h3>
              <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70 mt-0.5">{featuredVideo.eventTitle} · {featuredVideo.dateFormatted}</p>
            </div>
          </button>
          {featuredVideoModalOpen && (
            <div
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
              onClick={() => setFeaturedVideoModalOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label="Assistir vídeo em destaque"
            >
              <div className="relative w-full max-w-5xl aspect-video bg-black rounded-lg sm:rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <button
                  ref={featuredVideoCloseRef}
                  type="button"
                  onClick={() => setFeaturedVideoModalOpen(false)}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-2 sm:p-2.5 transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg touch-manipulation"
                  aria-label="Fechar vídeo (Esc)"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${featuredVideo.id}?autoplay=1&rel=0`}
                  title={featuredVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
          <p className="text-center mt-4">
            <Link to="/apresentacoes" className="text-sm font-semibold text-rjb-yellow hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded">
              Ver todas as apresentações →
            </Link>
          </p>
        </section>
      )}

      {/* Números / mini-stats */}
      <section id="numeros" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-20 rounded-3xl bg-gradient-to-b from-rjb-yellow/5 to-transparent dark:from-rjb-yellow/5 dark:to-transparent" aria-labelledby="numeros-heading">
        <h2 id="numeros-heading" className="sr-only">Números da RJB</h2>
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12 md:gap-16">
          <div className="text-center">
            <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-rjb-yellow tabular-nums">{totalSongs}</p>
            <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">músicas no repertório</p>
          </div>
          <div className="text-center">
            <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-rjb-yellow tabular-nums">{nextShowsCount}</p>
            <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">apresentações em 2026</p>
          </div>
          <div className="text-center" aria-live="polite" aria-atomic="true">
            <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-rjb-yellow tabular-nums">
              {totalComponents === null ? '...' : totalComponents}
            </p>
            <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
              <a href="#componentes" className="hover:text-rjb-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded underline-offset-2 hover:underline">
                componentes em todo o Brasil
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Mapa: componentes por estado */}
      <section id="componentes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-20" aria-labelledby="mapa-brasil-title">
        <div className="text-center mb-8 sm:mb-10">
          <h2 id="mapa-brasil-title" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-text dark:text-rjb-text-dark mb-2">
            Componentes por estado
          </h2>
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 max-w-2xl mx-auto">
            A Racional Jazz Band reúne componentes de diversos estados do Brasil. Passe o mouse sobre um estado para ver a quantidade.
          </p>
        </div>
        <BrazilMap onTotalLoad={setTotalComponents} />
      </section>

      {/* Mapa de palco: nome, UF e instrumento */}
      <section id="mapa-palco" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-20" aria-labelledby="mapa-palco-title">
        <div className="text-center mb-8 sm:mb-10">
          <h2 id="mapa-palco-title" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-text dark:text-rjb-text-dark mb-2">
            Mapa de palco
          </h2>
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 max-w-2xl mx-auto">
            Naipe de madeiras e metais, regentes, vozes, percussão, cordas e teclas.
          </p>
        </div>
        <StageRoster />
      </section>
      
      <section id="nossa-essencia" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 -mt-4 relative z-20" aria-labelledby="nossa-essencia-title">
        <div className="text-center mb-8 sm:mb-10">
          <h2 id="nossa-essencia-title" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-rjb-text dark:text-rjb-text-dark mb-2">
            Nossa essência
          </h2>
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 max-w-2xl mx-auto">
            O que nos move: música instrumental, repertório único e compromisso com a cultura.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6h.01M21 3h.01"></path>
              ),
              title: 'Música Instrumental',
              description: 'A harmonia perfeita entre os instrumentos e o saber.',
              to: '/sobre',
              ariaLabel: 'Saiba mais sobre nossa música instrumental na página Sobre',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8l4-2 4 2V7m0 8a2 2 0 11-4 0 2 2 0 014 0zM12 11c0 1.657-1.343 3-3 3H5a2 2 0 01-2-2v-3a2 2 0 012-2h4a2 2 0 012 2v1zM21 17a2 2 0 01-2 2h-5m-7-2a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v5"></path>
              ),
              title: 'Repertório Único',
              description: 'Composições próprias e arranjos exclusivos da cultura Racional.',
              to: '/player',
              ariaLabel: 'Ouça o repertório na página Músicas',
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              ),
              title: 'Compromisso Cultural',
              description: 'Divulgando a Cultura Racional em eventos e apresentações.',
              to: '/apresentacoes',
              ariaLabel: 'Ver apresentações e agenda',
            },
          ].map((card, index) => (
            <Link
              key={index}
              to={card.to}
              aria-label={card.ariaLabel}
              className="group relative block p-5 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/95 to-rjb-card-light/90 dark:from-rjb-card-dark dark:via-rjb-card-dark/95 dark:to-rjb-card-dark/90 shadow-xl dark:shadow-2xl dark:shadow-black/50 border-t-4 border-rjb-yellow/70 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:border-rjb-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 animate-fade-in"
              style={{ animationDelay: `${600 + index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rjb-yellow/0 to-rjb-yellow/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-rjb-yellow/20 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:to-rjb-yellow/5 mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
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
            </Link>
          ))}
        </div>
      </section>

      {/* Avise-me dos próximos shows */}
      <section id="avise-me" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-20" aria-labelledby="avise-me-title">
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-rjb-yellow/20 via-rjb-yellow/15 to-rjb-yellow/10 dark:from-rjb-yellow/15 dark:via-rjb-yellow/10 dark:to-rjb-yellow/5 border-2 border-rjb-yellow/30 p-6 sm:p-8 md:p-10 text-center">
          <h2 id="avise-me-title" className="text-xl sm:text-2xl md:text-3xl font-extrabold text-rjb-text dark:text-rjb-text-dark mb-2">
            Quer ser avisado dos próximos shows?
          </h2>
          <p className="text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 max-w-xl mx-auto mb-6">
            Entre em contato e receba informações sobre as próximas apresentações da Racional Jazz Band.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/contato"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rjb-yellow text-rjb-text font-bold hover:bg-yellow-500 transition-colors shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Avise-me
            </Link>
            <Link
              to="/agenda"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-rjb-yellow/60 text-rjb-text dark:text-rjb-text-dark font-semibold hover:bg-rjb-yellow/15 dark:hover:bg-rjb-yellow/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Ver datas na Agenda
            </Link>
          </div>
        </div>
      </section>

      {/* Explore: atalhos para páginas principais */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-20 relative z-20" aria-label="Explore o site">
        <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-sm sm:text-base text-rjb-text/80 dark:text-rjb-text-dark/80 border-t border-stone-200 dark:border-stone-600/60 pt-8">
          <span className="sr-only">Explore:</span>
          <Link to="/apresentacoes" className="hover:text-rjb-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded transition-colors">Apresentações</Link>
          <span aria-hidden className="text-rjb-text/40 dark:text-rjb-text-dark/40">·</span>
          <Link to="/player" className="hover:text-rjb-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded transition-colors">Músicas</Link>
          <span aria-hidden className="text-rjb-text/40 dark:text-rjb-text-dark/40">·</span>
          <Link to="/agenda" className="hover:text-rjb-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded transition-colors">Agenda</Link>
          <span aria-hidden className="text-rjb-text/40 dark:text-rjb-text-dark/40">·</span>
          <Link to="/partituras" className="hover:text-rjb-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded transition-colors">Partituras</Link>
          <span aria-hidden className="text-rjb-text/40 dark:text-rjb-text-dark/40">·</span>
          <Link to="/repertorio-apresentacoes" className="hover:text-rjb-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded transition-colors">Repertório 2026</Link>
          <span aria-hidden className="text-rjb-text/40 dark:text-rjb-text-dark/40">·</span>
          <Link to="/contato" className="hover:text-rjb-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded transition-colors">Contato</Link>
        </div>
      </nav>
    </>
  )
}

export default Home
