import { useState } from 'react'
import { useAudio } from '../contexts/AudioContext'

const NowPlayingBar = () => {
  const { currentTrack, isPlaying, currentTime, duration, togglePlayPause, stopTrack } = useAudio()
  const [isExpanded, setIsExpanded] = useState(false)

  const handleClose = () => {
    stopTrack()
    setIsExpanded(false)
  }

  if (!currentTrack) return null

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      {/* Mini Player Bar - Fixo na parte inferior */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-rjb-yellow via-yellow-500 to-yellow-500 shadow-2xl border-t-2 border-yellow-400/50 transition-all duration-300 now-playing-enter ${
          isExpanded ? 'h-auto pb-safe' : 'h-16 sm:h-20'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        {/* Barra de Progresso */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-600/30">
          <div 
            className="h-full bg-white/80 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Conteúdo do Player */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          {/* Versão Compacta */}
          {!isExpanded && (
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 h-16 sm:h-20">
              {/* Botão Fechar (X) */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClose()
                }}
                className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation"
                aria-label="Fechar player"
                title="Fechar player"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>

              {/* Botão Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlayPause()
                }}
                className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation shadow-lg"
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                  </svg>
                )}
              </button>

              {/* Informações da Música */}
              <div className="flex-1 min-w-0 px-1">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6h.01M21 3h.01"></path>
                  </svg>
                  <p className="text-[10px] sm:text-xs md:text-sm font-semibold text-white/90 uppercase tracking-wide truncate">
                    Tocando
                  </p>
                </div>
                <p className="text-xs sm:text-sm md:text-base font-bold text-white truncate leading-tight">
                  {currentTrack.title}
                </p>
              </div>

              {/* Tempo - Oculto no mobile muito pequeno */}
              <div className="hidden xs:flex flex-shrink-0 text-right">
                <p className="text-[10px] sm:text-xs md:text-sm font-medium text-white/90 whitespace-nowrap">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>

              {/* Botão Expandir */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsExpanded(true)
                }}
                className="flex-shrink-0 p-1.5 sm:p-2 text-white/80 hover:text-white transition-colors touch-manipulation"
                aria-label="Expandir player"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                </svg>
              </button>
            </div>
          )}

          {/* Versão Expandida */}
          {isExpanded && (
            <div className="py-3 sm:py-4 md:py-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-1">
                    Tocando Agora
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">
                    {currentTrack.title}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClose()
                    }}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation"
                    aria-label="Fechar player"
                    title="Fechar player"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsExpanded(false)
                    }}
                    className="flex-shrink-0 p-2 text-white/80 hover:text-white transition-colors touch-manipulation"
                    aria-label="Recolher player"
                    title="Recolher player"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Barra de Progresso Interativa */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-white/80">{formatTime(currentTime)}</span>
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                    <div 
                      className="h-full bg-white/80 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/80">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    stopTrack()
                  }}
                  className="p-2 sm:p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation"
                  aria-label="Parar"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"></path>
                  </svg>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePlayPause()
                  }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/30 hover:bg-white/40 backdrop-blur-sm flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-xl touch-manipulation"
                  aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </>
  )
}

export default NowPlayingBar
