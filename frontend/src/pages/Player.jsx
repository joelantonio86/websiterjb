import { useState, useEffect, useMemo, useRef } from 'react'
import PageWrapper from '../components/PageWrapper'
import { racionais, diversas, R2_BASE_URL } from '../data/songs'
import { useAudio } from '../contexts/AudioContext'

const SOURCE_ORIGINAL = 'original'
const SOURCE_SIBELIUS = 'sibelius'

const buildTrack = (item, folder, source) => {
  const base = `${R2_BASE_URL}/${folder}`
  const path = source === SOURCE_ORIGINAL
    ? `${base}/mp3original/${item.mp3}.mp3`
    : `${base}/mp3/${item.mp3}.mp3`
  // Query param evita cache servir áudio da pasta errada (original vs Sibelius)
  const audioUrl = `${path}?v=${source}`
  return {
    id: `${source}-${folder}-${item.mp3}`,
    title: item.title,
    time: item.time,
    audioUrl,
    folder,
    isRacional: folder === 'racionais'
  }
}

// Ordem: primeiro Músicas Racionais (A–Z), depois Outros Clássicos (A–Z) — para next/prev respeitarem a mesma sequência da tela
const racionaisOriginal = [...racionais.map(s => buildTrack(s, 'racionais', SOURCE_ORIGINAL))].sort((a, b) => a.title.localeCompare(b.title))
const diversasOriginal = [...diversas.map(s => buildTrack(s, 'diversas', SOURCE_ORIGINAL))].sort((a, b) => a.title.localeCompare(b.title))
const allTracksOriginal = [...racionaisOriginal, ...diversasOriginal]

const racionaisSibelius = [...racionais.map(s => buildTrack(s, 'racionais', SOURCE_SIBELIUS))].sort((a, b) => a.title.localeCompare(b.title))
const diversasSibelius = [...diversas.map(s => buildTrack(s, 'diversas', SOURCE_SIBELIUS))].sort((a, b) => a.title.localeCompare(b.title))
const allTracksSibelius = [...racionaisSibelius, ...diversasSibelius]

const formatTime = (seconds) => {
  if (seconds == null || !Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const Player = () => {
  const { currentTrack, isPlaying, currentTime, duration, trackError, playTrack, togglePlayPause, seekTo, stopTrack, setOnTrackEnded } = useAudio()
  const [source, setSource] = useState(SOURCE_ORIGINAL)
  const [searchTerm, setSearchTerm] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [mobilePlayerOpen, setMobilePlayerOpen] = useState(true) // mobile: player maximizado por padrão
  const [sectionsOpen, setSectionsOpen] = useState({ racionais: true, diversas: true }) // web: expandir/colapsar categorias
  const listContainerRef = useRef(null)
  const activeTrackRef = useRef(null)
  const drawerActiveTrackRef = useRef(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Ao trocar de aba: parar a música, fechar drawer no mobile e reabrir seções na web
  useEffect(() => {
    stopTrack()
    setMobilePlayerOpen(false)
    setSectionsOpen({ racionais: true, diversas: true })
  }, [source])

  // Rolagem da lista (página) para acompanhar a música em reprodução
  useEffect(() => {
    if (!currentTrack || !activeTrackRef.current || !listContainerRef.current) return
    activeTrackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [currentTrack?.audioUrl])

  // Rolagem da lista dentro do drawer: aguarda o React atualizar o DOM antes de fazer scroll
  useEffect(() => {
    if (!mobilePlayerOpen || !currentTrack) return
    const id = requestAnimationFrame(() => {
      if (drawerActiveTrackRef.current) {
        drawerActiveTrackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
      }
    })
    return () => cancelAnimationFrame(id)
  }, [currentTrack?.audioUrl, mobilePlayerOpen])

  const tracks = source === SOURCE_ORIGINAL ? allTracksOriginal : allTracksSibelius
  // Lista única na ordem da tela: Racionais (A–Z) depois Diversas (A–Z); busca só filtra, mantém a ordem
  const filteredTracks = useMemo(() => {
    if (!searchTerm.trim()) return tracks
    const norm = searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return tracks.filter(t =>
      t.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(norm)
    )
  }, [tracks, searchTerm])

  const racionaisFiltered = filteredTracks.filter(t => t.isRacional)
  const diversasFiltered = filteredTracks.filter(t => !t.isRacional)

  // Track exibida no card: a que está tocando ou a primeira da lista (padrão ao carregar)
  const displayTrack = currentTrack
    ? filteredTracks.find(t => t.audioUrl === currentTrack.audioUrl) || filteredTracks[0]
    : filteredTracks[0]

  const currentIndex = currentTrack
    ? filteredTracks.findIndex(t => t.audioUrl === currentTrack.audioUrl)
    : 0
  const hasNext = filteredTracks.length > 0 && currentIndex < filteredTracks.length - 1
  const hasPrev = currentIndex > 0

  // Player sequencial: ao terminar uma música, tocar a próxima da lista
  useEffect(() => {
    setOnTrackEnded(() => {
      if (hasNext) {
        const next = filteredTracks[currentIndex + 1]
        playTrack(next.title, next.audioUrl)
        return true
      }
      return false
    })
    return () => setOnTrackEnded(null)
  }, [setOnTrackEnded, hasNext, currentIndex, filteredTracks, playTrack])

  const playNext = () => {
    if (!hasNext) return
    const next = filteredTracks[currentIndex + 1]
    playTrack(next.title, next.audioUrl)
  }

  const playPrev = () => {
    if (!hasPrev) return
    const prev = filteredTracks[currentIndex - 1]
    playTrack(prev.title, prev.audioUrl)
  }

  const playDisplayTrack = () => {
    if (displayTrack) playTrack(displayTrack.title, displayTrack.audioUrl)
  }

  const handleSeek = (e) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const time = pct * duration
    seekTo(time)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const toggleSection = (key) => {
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const renderTrackList = (list, categoryLabel, categoryColor, accordion = null) => {
    if (!list.length) return null
    const { sectionKey, isExpanded } = accordion || {}
    const showAccordion = accordion != null
    return (
      <div className="mb-8">
        <button
          type="button"
          onClick={showAccordion ? () => toggleSection(sectionKey) : undefined}
          className={`w-full flex items-center gap-3 mb-4 text-left transition-colors rounded-xl -mx-1 px-1 py-1 ${
            showAccordion ? 'hover:bg-rjb-text/5 dark:hover:bg-rjb-text-dark/5 cursor-pointer touch-manipulation' : 'cursor-default'
          }`}
          aria-expanded={showAccordion ? isExpanded : undefined}
          aria-label={showAccordion ? (isExpanded ? `Recolher ${categoryLabel}` : `Expandir ${categoryLabel}`) : undefined}
        >
          <div className={`h-1 w-8 rounded-full flex-shrink-0 ${
            categoryColor.includes('yellow') ? 'bg-rjb-yellow' : 'bg-blue-500 dark:bg-blue-400'
          } opacity-80`} />
          <h3 className={`text-base sm:text-lg font-bold flex-1 ${categoryColor}`}>
            {categoryLabel}
          </h3>
          <span className="text-sm text-rjb-text/50 dark:text-rjb-text-dark/50 font-medium">
            ({list.length})
          </span>
          {showAccordion && (
            <svg
              className={`w-5 h-5 text-rjb-text/60 dark:text-rjb-text-dark/60 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
        {(!showAccordion || isExpanded) && (
        <ul className="space-y-2">
          {list.map((track) => {
            const isCurrent = currentTrack?.audioUrl === track.audioUrl
            return (
              <li
                key={track.id}
                ref={isCurrent ? activeTrackRef : null}
                className={`group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 active:scale-[0.98] touch-manipulation ${
                  isCurrent
                    ? 'bg-gradient-to-r from-rjb-yellow/20 to-rjb-yellow/10 dark:from-rjb-yellow/15 dark:to-rjb-yellow/5 border-2 border-rjb-yellow/50 shadow-md'
                    : 'bg-rjb-card-light dark:bg-rjb-card-dark border-2 border-transparent hover:border-rjb-yellow/20 hover:shadow-md'
                }`}
              >
                <button
                  onClick={() => {
                    if (isCurrent) togglePlayPause()
                    else playTrack(track.title, track.audioUrl)
                  }}
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 min-w-[48px] min-h-[48px] shadow-sm ${
                    isCurrent && isPlaying
                      ? 'bg-rjb-yellow text-rjb-text shadow-lg scale-105'
                      : 'bg-rjb-yellow/20 text-rjb-yellow hover:bg-rjb-yellow/30 hover:scale-105 active:scale-95'
                  }`}
                  aria-label={isCurrent && isPlaying ? 'Pausar' : `Tocar ${track.title}`}
                >
                  {isCurrent && isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-base truncate mb-1 ${
                    isCurrent 
                      ? 'text-rjb-yellow' 
                      : 'text-rjb-text dark:text-rjb-text-dark'
                  }`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 font-medium">
                    {track.time}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
        )}
      </div>
    )
  }

  return (
    <PageWrapper title="Player / Ouça nossas músicas">
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header: compacto no mobile */}
        <div className="mb-5 lg:mb-8 px-0">
          <h1 className="text-xl sm:text-3xl font-bold text-rjb-text dark:text-rjb-text-dark mb-1 sm:mb-2 text-center lg:text-left">
            Player de Músicas
          </h1>
          <p className="text-xs sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70 text-center lg:text-left">
            Ouça as gravações originais ou as versões do Sibelius
          </p>
        </div>

        {/* Tabs: Design moderno e minimalista */}
        <div className="flex gap-2 mb-6 lg:mb-8 bg-rjb-card-light dark:bg-rjb-card-dark p-1.5 rounded-2xl border border-rjb-yellow/20 shadow-sm">
          <button
            type="button"
            onClick={() => setSource(SOURCE_ORIGINAL)}
            className={`flex-1 min-h-[52px] sm:min-h-[48px] py-3 px-4 font-semibold text-sm sm:text-base rounded-xl transition-all duration-200 active:scale-[0.97] touch-manipulation ${
              source === SOURCE_ORIGINAL
                ? 'bg-rjb-yellow text-rjb-text shadow-md'
                : 'text-rjb-text/70 dark:text-rjb-text-dark/70 hover:text-rjb-text dark:hover:text-rjb-text-dark hover:bg-rjb-yellow/10'
            }`}
          >
            <span className="mr-2">🎙️</span>
            Originais
          </button>
          <button
            type="button"
            onClick={() => setSource(SOURCE_SIBELIUS)}
            className={`flex-1 min-h-[52px] sm:min-h-[48px] py-3 px-4 font-semibold text-sm sm:text-base rounded-xl transition-all duration-200 active:scale-[0.97] touch-manipulation ${
              source === SOURCE_SIBELIUS
                ? 'bg-rjb-yellow text-rjb-text shadow-md'
                : 'text-rjb-text/70 dark:text-rjb-text-dark/70 hover:text-rjb-text dark:hover:text-rjb-text-dark hover:bg-rjb-yellow/10'
            }`}
          >
            <span className="mr-2">🎼</span>
            Sibelius
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* MOBILE: Player em destaque no topo; depois lista */}
          <div className="lg:col-span-2 order-1 flex flex-col lg:block">
            {/* 1) Player no topo (só mobile) — foco principal */}
            {displayTrack && (
              <div className="lg:hidden mb-6 order-first">
                <button
                  type="button"
                  onClick={() => setMobilePlayerOpen(true)}
                  className={`w-full rounded-2xl border-2 transition-all duration-200 text-left touch-manipulation active:scale-[0.98] overflow-hidden ${
                    currentTrack && isPlaying
                      ? 'bg-gradient-to-br from-rjb-yellow/15 to-transparent dark:from-rjb-yellow/10 dark:to-transparent border-rjb-yellow/40 shadow-lg'
                      : 'bg-rjb-card-light dark:bg-rjb-card-dark border-rjb-yellow/25 shadow-md hover:border-rjb-yellow/40'
                  }`}
                  aria-label="Abrir player completo"
                >
                  {/* Linha 1: ícone + título + controles */}
                  <div className="flex items-center gap-4 p-4">
                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
                      currentTrack && isPlaying ? 'bg-rjb-yellow/30' : 'bg-rjb-yellow/20 dark:bg-rjb-yellow/10'
                    }`}>
                      <span className="text-3xl">🎵</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base text-rjb-text dark:text-rjb-text-dark truncate">
                        {displayTrack.title}
                      </p>
                      <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 mt-0.5">
                        {currentTrack
                          ? (isPlaying ? 'Tocando' : 'Pausado')
                          : 'Toque para reproduzir'}
                        {currentTrack && ' · '}
                        {currentTrack && (displayTrack.audioUrl.includes('mp3original') ? 'Original' : 'Sibelius')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button type="button" onClick={(e) => { e.stopPropagation(); playPrev() }} disabled={!hasPrev}
                        className="w-11 h-11 rounded-full bg-rjb-text/10 dark:bg-rjb-text-dark/10 flex items-center justify-center disabled:opacity-40 touch-manipulation active:scale-95 min-w-[44px] min-h-[44px]"
                        aria-label="Anterior">
                        <svg className="w-5 h-5 text-rjb-text dark:text-rjb-text-dark" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.445 14.832A1 1 0 0010 14V6a1 1 0 00-1.555-.832l-4 3a1 1 0 000 1.664l4 3z" />
                          <path fillRule="evenodd" d="M14 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); (currentTrack ? togglePlayPause : playDisplayTrack)() }}
                        className="w-12 h-12 rounded-full bg-rjb-yellow text-rjb-text flex items-center justify-center touch-manipulation active:scale-95 shadow-md min-w-[48px] min-h-[48px]"
                        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}>
                        {isPlaying ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        )}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); playNext() }} disabled={!hasNext}
                        className="w-11 h-11 rounded-full bg-rjb-text/10 dark:bg-rjb-text-dark/10 flex items-center justify-center disabled:opacity-40 touch-manipulation active:scale-95 min-w-[44px] min-h-[44px]"
                        aria-label="Próxima">
                        <svg className="w-5 h-5 text-rjb-text dark:text-rjb-text-dark" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6l4 4-4 4V6z" /><path fillRule="evenodd" d="M16 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* Barra de progresso (só quando tocando) */}
                  {currentTrack && (
                    <div className="h-1 bg-rjb-text/10 dark:bg-rjb-text-dark/10">
                      <div className="h-full bg-rjb-yellow rounded-r-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  {/* Link para abrir drawer */}
                  <div className="px-4 py-2.5 border-t border-rjb-yellow/20 dark:border-rjb-text-dark/10 flex items-center justify-center gap-1.5">
                    <span className="text-xs font-medium text-rjb-yellow">Ver lista e controles completos</span>
                    <svg className="w-4 h-4 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            )}

            {/* 2) Lista: título (mobile) + busca + faixas */}
            <div className="lg:order-2">
              <p className="lg:hidden text-sm font-semibold text-rjb-text/70 dark:text-rjb-text-dark/70 uppercase tracking-wide mb-3 mt-1">
                Escolher próxima música
              </p>
              <div className="relative mb-5">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar música..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-rjb-card-light dark:bg-rjb-card-dark border border-rjb-yellow/20 focus:border-rjb-yellow focus:ring-2 focus:ring-rjb-yellow/20 outline-none transition-all text-base shadow-sm"
                  aria-label="Buscar música"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rjb-text/50 dark:text-rjb-text-dark/50 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div ref={listContainerRef} className="max-h-[calc(100vh-420px)] sm:max-h-[55vh] lg:max-h-[60vh] overflow-y-auto pr-1 sm:pr-2 lg:order-3">
              {renderTrackList(racionaisFiltered, 'Músicas Racionais', 'text-rjb-yellow', { sectionKey: 'racionais', isExpanded: sectionsOpen.racionais })}
              {renderTrackList(diversasFiltered, 'Outros Clássicos', 'text-blue-600 dark:text-blue-400', { sectionKey: 'diversas', isExpanded: sectionsOpen.diversas })}
              {filteredTracks.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-rjb-yellow/10 dark:bg-rjb-yellow/5 flex items-center justify-center">
                    <svg className="w-10 h-10 text-rjb-text/40 dark:text-rjb-text-dark/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-rjb-text dark:text-rjb-text-dark mb-1">
                    Nenhuma música encontrada
                  </p>
                  <p className="text-sm text-rjb-text/60 dark:text-rjb-text-dark/60">
                    Tente buscar com outros termos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Now Playing — apenas desktop; no mobile usa mini player + drawer */}
          <div className="hidden lg:block lg:col-span-1 order-2">
            <div className="sticky top-24 rounded-2xl bg-gradient-to-br from-rjb-card-light to-rjb-card-light/95 dark:from-rjb-card-dark dark:to-rjb-card-dark/95 border-2 border-rjb-yellow/30 shadow-xl p-6">
              <h3 className="text-sm font-bold text-rjb-text/70 dark:text-rjb-text-dark/70 uppercase tracking-wide mb-4">
                Tocando agora
              </h3>

              {displayTrack ? (
                <>
                  <div className="aspect-square max-w-full mx-auto rounded-xl bg-gradient-to-br from-rjb-yellow/20 to-yellow-500/10 dark:from-rjb-yellow/10 dark:to-yellow-500/5 flex items-center justify-center mb-4">
                    <span className="text-6xl">🎵</span>
                  </div>
                  <p className="font-bold text-lg text-rjb-text dark:text-rjb-text-dark text-center truncate mb-1">
                    {displayTrack.title}
                  </p>
                  <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 text-center mb-4">
                    {displayTrack.audioUrl.includes('mp3original') ? 'Gravação original' : 'Versão Sibelius'}
                  </p>

                  {trackError && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/30">
                      <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
                        Música indisponível no servidor.
                      </p>
                      <p className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 text-center mt-1">
                        Clique em Próxima para tentar a seguinte.
                      </p>
                    </div>
                  )}

                  {/* Progress - só interativo quando há track tocando */}
                  <div className="mb-4">
                    <div
                      role="progressbar"
                      tabIndex={0}
                      onClick={currentTrack ? handleSeek : undefined}
                      onKeyDown={currentTrack ? (e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click() } : undefined}
                      className={`h-2 bg-white/20 dark:bg-white/10 rounded-full overflow-hidden ${currentTrack ? 'cursor-pointer' : ''}`}
                    >
                      <div
                        className="h-full bg-gradient-to-r from-rjb-yellow to-yellow-500 rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={playPrev}
                      disabled={!hasPrev}
                      className="w-12 h-12 rounded-full bg-rjb-text/10 dark:bg-rjb-text-dark/10 text-rjb-text dark:text-rjb-text-dark flex items-center justify-center hover:bg-rjb-text/20 dark:hover:bg-rjb-text-dark/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                      aria-label="Anterior"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.445 14.832A1 1 0 0010 14V6a1 1 0 00-1.555-.832l-4 3a1 1 0 000 1.664l4 3z" />
                        <path fillRule="evenodd" d="M14 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={currentTrack ? togglePlayPause : playDisplayTrack}
                      className="w-14 h-14 rounded-full bg-rjb-yellow text-rjb-text flex items-center justify-center hover:bg-yellow-500 transition-all shadow-lg"
                      aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                    >
                      {isPlaying ? (
                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={playNext}
                      disabled={!hasNext}
                      className="w-12 h-12 rounded-full bg-rjb-text/10 dark:bg-rjb-text-dark/10 text-rjb-text dark:text-rjb-text-dark flex items-center justify-center hover:bg-rjb-text/20 dark:hover:bg-rjb-text-dark/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                      aria-label="Próxima"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6l4 4-4 4V6z" />
                        <path fillRule="evenodd" d="M16 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-rjb-text/60 dark:text-rjb-text-dark/60">
                    Nenhuma música na lista.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer full-view (mobile): player + lista em uma única tela rolável */}
        {displayTrack && (
          <>
            {mobilePlayerOpen && (
              <>
                <button
                  type="button"
                  onClick={() => setMobilePlayerOpen(false)}
                  className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                  aria-label="Fechar player"
                />
                <div
                  className="lg:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-rjb-card-light dark:bg-rjb-card-dark shadow-2xl now-playing-enter flex flex-col"
                  style={{
                    maxHeight: '94dvh',
                    minHeight: '85dvh',
                    paddingBottom: 'env(safe-area-inset-bottom, 1rem)',
                  }}
                >
                  {/* Área arrastável: handle + fechar */}
                  <div className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-2">
                    <span className="w-10 h-1 rounded-full bg-rjb-text/25 dark:bg-rjb-text-dark/25" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => setMobilePlayerOpen(false)}
                      className="w-10 h-10 rounded-full bg-rjb-text/10 dark:bg-rjb-text-dark/10 flex items-center justify-center text-rjb-text dark:text-rjb-text-dark touch-manipulation active:scale-95 min-w-[44px] min-h-[44px]"
                      aria-label="Fechar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Conteúdo rolável: arte + info + progresso + controles + lista */}
                  <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
                    {/* Capa e título */}
                    <div className="flex flex-col items-center text-center mb-5">
                      <div className="w-full max-w-[260px] aspect-square rounded-2xl bg-gradient-to-br from-rjb-yellow/25 to-yellow-500/15 dark:from-rjb-yellow/15 dark:to-yellow-500/10 flex items-center justify-center shadow-lg mb-4">
                        <span className="text-6xl" aria-hidden="true">🎵</span>
                      </div>
                      <h2 className="font-bold text-xl text-rjb-text dark:text-rjb-text-dark line-clamp-2 mb-1">
                        {displayTrack.title}
                      </h2>
                      <p className="text-sm text-rjb-text/60 dark:text-rjb-text-dark/60">
                        {displayTrack.audioUrl.includes('mp3original') ? 'Gravação original' : 'Versão Sibelius'}
                      </p>
                    </div>

                    {trackError && (
                      <div className="mb-4 p-3 rounded-xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 text-center">
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">Música indisponível</p>
                      </div>
                    )}

                    {/* Barra de progresso */}
                    <div className="mb-6">
                      <div
                        role="progressbar"
                        tabIndex={0}
                        onClick={currentTrack ? handleSeek : undefined}
                        onKeyDown={currentTrack ? (e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click() } : undefined}
                        className={`h-2.5 rounded-full overflow-hidden bg-rjb-text/10 dark:bg-rjb-text-dark/10 touch-manipulation ${currentTrack ? 'cursor-pointer' : ''}`}
                      >
                        <div
                          className="h-full bg-rjb-yellow rounded-full transition-all duration-150"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-rjb-text/60 dark:text-rjb-text-dark/60 mt-1.5 font-medium">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Controles: anterior | play | próxima */}
                    <div className="flex items-center justify-center gap-5 mb-8">
                      <button
                        type="button"
                        onClick={playPrev}
                        disabled={!hasPrev}
                        className="w-14 h-14 rounded-full bg-rjb-text/10 dark:bg-rjb-text-dark/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation active:scale-95 min-w-[56px] min-h-[56px]"
                        aria-label="Anterior"
                      >
                        <svg className="w-7 h-7 text-rjb-text dark:text-rjb-text-dark" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.445 14.832A1 1 0 0010 14V6a1 1 0 00-1.555-.832l-4 3a1 1 0 000 1.664l4 3z" />
                          <path fillRule="evenodd" d="M14 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={currentTrack ? togglePlayPause : playDisplayTrack}
                        className="w-20 h-20 rounded-full bg-rjb-yellow text-rjb-text flex items-center justify-center touch-manipulation active:scale-95 min-w-[72px] min-h-[72px] shadow-lg"
                        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                      >
                        {isPlaying ? (
                          <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-9 h-9 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={playNext}
                        disabled={!hasNext}
                        className="w-14 h-14 rounded-full bg-rjb-text/10 dark:bg-rjb-text-dark/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation active:scale-95 min-w-[56px] min-h-[56px]"
                        aria-label="Próxima"
                      >
                        <svg className="w-7 h-7 text-rjb-text dark:text-rjb-text-dark" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6l4 4-4 4V6z" />
                          <path fillRule="evenodd" d="M16 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    {/* Lista: header fixo visual + lista rolável */}
                    <div className="border-t border-rjb-yellow/15 dark:border-rjb-text-dark/10 pt-4">
                      <h4 className="sticky top-0 z-10 py-2 -mt-2 bg-rjb-card-light dark:bg-rjb-card-dark text-xs font-bold text-rjb-text/70 dark:text-rjb-text-dark/70 uppercase tracking-wider mb-2">
                        Escolher música
                      </h4>
                      <div className="space-y-3 pb-2">
                        {racionaisFiltered.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-rjb-yellow mb-2">Músicas Racionais ({racionaisFiltered.length})</p>
                            <ul className="space-y-1">
                              {racionaisFiltered.map((track) => {
                                const isCurrent = currentTrack?.audioUrl === track.audioUrl
                                return (
                                  <li key={track.id} ref={isCurrent ? drawerActiveTrackRef : null}>
                                    <button
                                      type="button"
                                      onClick={() => playTrack(track.title, track.audioUrl)}
                                      className={`w-full flex items-center gap-3 py-3 px-3 rounded-xl text-left touch-manipulation transition-all min-h-[48px] active:scale-[0.99] ${
                                        isCurrent ? 'bg-rjb-yellow/20 text-rjb-yellow' : 'hover:bg-rjb-text/5 dark:hover:bg-rjb-text-dark/5'
                                      }`}
                                    >
                                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-rjb-text/10 dark:bg-rjb-text-dark/10 flex items-center justify-center">
                                        {isCurrent && isPlaying ? (
                                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        ) : (
                                          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                        )}
                                      </span>
                                      <span className="flex-1 min-w-0 font-medium text-sm truncate text-rjb-text dark:text-rjb-text-dark">{track.title}</span>
                                      <span className="text-xs text-rjb-text/50 dark:text-rjb-text-dark/50 flex-shrink-0">{track.time}</span>
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )}
                        {diversasFiltered.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-blue-500 dark:text-blue-400 mb-2">Outros Clássicos ({diversasFiltered.length})</p>
                            <ul className="space-y-1">
                              {diversasFiltered.map((track) => {
                                const isCurrent = currentTrack?.audioUrl === track.audioUrl
                                return (
                                  <li key={track.id} ref={isCurrent ? drawerActiveTrackRef : null}>
                                    <button
                                      type="button"
                                      onClick={() => playTrack(track.title, track.audioUrl)}
                                      className={`w-full flex items-center gap-3 py-3 px-3 rounded-xl text-left touch-manipulation transition-all min-h-[48px] active:scale-[0.99] ${
                                        isCurrent ? 'bg-rjb-yellow/20 text-rjb-yellow' : 'hover:bg-rjb-text/5 dark:hover:bg-rjb-text-dark/5'
                                      }`}
                                    >
                                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-rjb-text/10 dark:bg-rjb-text-dark/10 flex items-center justify-center">
                                        {isCurrent && isPlaying ? (
                                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        ) : (
                                          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                        )}
                                      </span>
                                      <span className="flex-1 min-w-0 font-medium text-sm truncate text-rjb-text dark:text-rjb-text-dark">{track.title}</span>
                                      <span className="text-xs text-rjb-text/50 dark:text-rjb-text-dark/50 flex-shrink-0">{track.time}</span>
                                    </button>
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        )}
                        {filteredTracks.length === 0 && (
                          <p className="text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 py-4 text-center">Nenhuma música na lista.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  )
}

export default Player
