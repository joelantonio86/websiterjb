import { createContext, useContext, useState, useRef, useEffect } from 'react'

const MusicPlayerContext = createContext()

export const useAudio = () => {
  const context = useContext(MusicPlayerContext)
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider')
  }
  return context
}

export const AudioProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [trackError, setTrackError] = useState(false)
  const audioRef = useRef(null)
  const playAttemptIdRef = useRef(0)
  const onTrackEndedRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => {
      const handled = onTrackEndedRef.current?.()
      if (handled) return
      setIsPlaying(false)
      setCurrentTrack(null)
      setCurrentTime(0)
      setTrackError(false)
    }
    // Não setar trackError aqui; o erro é tratado no listener por tentativa em playTrack
    const handleError = () => {
      setIsPlaying(false)
      setDuration(0)
      setCurrentTime(0)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  // Aplicar volume no áudio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resumeTrack = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().catch(error => {
        console.error('Erro ao reproduzir áudio:', error)
      })
      setIsPlaying(true)
    }
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseTrack()
    } else {
      resumeTrack()
    }
  }

  const stopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = ''
    }
    setIsPlaying(false)
    setCurrentTrack(null)
    setCurrentTime(0)
    setTrackError(false)
  }

  const seekTo = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const playTrack = async (title, audioUrl) => {
    setTrackError(false)
    playAttemptIdRef.current += 1
    const thisAttempt = playAttemptIdRef.current

    // Se já está tocando a mesma música, fazer toggle play/pause
    if (currentTrack?.audioUrl === audioUrl) {
      togglePlayPause()
      return
    }

    // Se é uma música diferente, parar a atual e tocar a nova
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    setCurrentTrack({ title, audioUrl })
    setIsPlaying(true)

    const audio = audioRef.current
    if (!audio) return

    const onError = () => {
      if (playAttemptIdRef.current === thisAttempt) {
        setTrackError(true)
        setIsPlaying(false)
      }
    }
    audio.addEventListener('error', onError, { once: true })

    audio.src = audioUrl
    audio.load()
    audio.play().catch(() => {
      if (playAttemptIdRef.current === thisAttempt) {
        setTrackError(true)
        setIsPlaying(false)
      }
    })
  }

  const setOnTrackEnded = (callback) => {
    onTrackEndedRef.current = callback
  }

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        setVolume,
        trackError,
        setTrackError,
        playTrack,
        pauseTrack,
        resumeTrack,
        stopTrack,
        togglePlayPause,
        seekTo,
        setOnTrackEnded
      }}
    >
      {children}
      <audio ref={audioRef} preload="none" />
    </MusicPlayerContext.Provider>
  )
}
