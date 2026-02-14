import { useState, useRef, useEffect } from 'react'
import { useAudio } from '../contexts/AudioContext'

const AudioPlayer = ({ src, className = '', title }) => {
  const progressRef = useRef(null)
  const { currentTrack, isPlaying: globalIsPlaying, currentTime: globalCurrentTime, duration: globalDuration, volume: globalVolume, setVolume: setGlobalVolume, playTrack, togglePlayPause, seekTo } = useAudio()
  
  const [showVolume, setShowVolume] = useState(false)
  const [localDuration, setLocalDuration] = useState(0)
  
  // Verificar se esta é a música atual sendo tocada
  const isCurrentTrack = currentTrack?.audioUrl === src
  const isPlaying = isCurrentTrack && globalIsPlaying
  const currentTime = isCurrentTrack ? globalCurrentTime : 0
  const duration = isCurrentTrack ? globalDuration : localDuration
  
  // Loading apenas quando o usuário deu play e a duração ainda não foi carregada
  const isLoading = isPlaying && duration === 0

  // Carregar duração local quando não é a track atual (para mostrar duração antes de tocar)
  useEffect(() => {
    if (!isCurrentTrack && src) {
      const audio = new Audio(src)
      audio.preload = 'metadata'
      const handleLoadedMetadata = () => {
        if (Number.isFinite(audio.duration)) {
          setLocalDuration(audio.duration)
        }
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.src = ''
      }
    }
  }, [src, isCurrentTrack])

  const handlePlayPause = () => {
    if (!title) {
      // Fallback para quando não há título (compatibilidade)
      const audio = audioRef.current
      if (!audio) return
      
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      return
    }

    // Se já é a música atual, fazer toggle
    if (isCurrentTrack) {
      togglePlayPause()
    } else {
      // Tocar nova música (isso automaticamente para a anterior)
      playTrack(title, src)
    }
  }

  const handleProgressClick = (e) => {
    if (!progressRef.current || !isCurrentTrack || duration === 0) return

    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newTime = percent * duration
    
    // Usar o seekTo do contexto
    if (isCurrentTrack && seekTo) {
      seekTo(newTime)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setGlobalVolume(newVolume)
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`relative bg-gradient-to-r from-rjb-yellow/10 via-yellow-500/5 to-rjb-yellow/10 dark:from-rjb-yellow/20 dark:via-yellow-500/10 dark:to-rjb-yellow/20 rounded-xl p-3 sm:p-4 border border-rjb-yellow/30 dark:border-rjb-yellow/20 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Botão Play/Pause */}
        <button
          onClick={handlePlayPause}
          className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-rjb-yellow to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-rjb-text shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation group ${
            isLoading ? 'opacity-70 cursor-wait' : ''
          } ${isCurrentTrack ? 'ring-2 ring-rjb-yellow/50' : ''}`}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isPlaying ? (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
            </svg>
          )}
        </button>

        {/* Barra de Progresso e Tempo */}
        <div className="flex-1 min-w-0">
          {/* Barra de Progresso */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="relative h-2 bg-white/20 dark:bg-white/10 rounded-full cursor-pointer mb-2 group/progress"
          >
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-rjb-yellow to-yellow-500 rounded-full transition-all duration-100 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"></div>
            </div>
          </div>

          {/* Tempo */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
            <span className="font-medium">{formatTime(currentTime)}</span>
            <span className="font-medium">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controle de Volume */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowVolume(!showVolume)}
            onMouseLeave={() => setShowVolume(false)}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 flex items-center justify-center transition-colors duration-200 touch-manipulation group/volume"
            aria-label="Volume"
          >
            {globalVolume === 0 ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rjb-text/70 dark:text-rjb-text-dark/70 group-hover/volume:text-rjb-yellow transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : globalVolume < 0.5 ? (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rjb-text/70 dark:text-rjb-text-dark/70 group-hover/volume:text-rjb-yellow transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rjb-text/70 dark:text-rjb-text-dark/70 group-hover/volume:text-rjb-yellow transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* Slider de Volume */}
          {showVolume && (
            <div
              className="absolute bottom-full right-0 mb-2 p-3 bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 rounded-xl shadow-2xl border border-rjb-yellow/30 z-10"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <div className="flex flex-col items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={globalVolume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-rjb-yellow"
                  style={{
                    background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${globalVolume * 100}%, rgba(255,255,255,0.2) ${globalVolume * 100}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
                <span className="text-xs text-rjb-text/70 dark:text-rjb-text-dark/70 font-medium">
                  {Math.round(globalVolume * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer
