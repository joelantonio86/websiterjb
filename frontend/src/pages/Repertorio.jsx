import { useState, useEffect } from 'react'
import PageWrapper from '../components/PageWrapper'
import { racionais, diversas, R2_BASE_URL } from '../data/songs'
import { useAudio } from '../contexts/AudioContext'

const Repertorio = () => {
  const { playTrack, currentTrack, isPlaying } = useAudio()
  const [playingButton, setPlayingButton] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    // Atualizar estado do botão quando a música muda
    if (currentTrack) {
      setPlayingButton(currentTrack.title)
    } else {
      setPlayingButton(null)
    }
  }, [currentTrack])

  const togglePlay = (title, mp3File, isRacional) => {
    const BASE_FOLDER = isRacional ? 'racionais' : 'diversas'
    const FULL_FOLDER_PATH = `${BASE_FOLDER}/mp3original`
    const audioUrl = `${R2_BASE_URL}/${FULL_FOLDER_PATH}/${mp3File}.mp3`

    try {
      playTrack(title, audioUrl)
    } catch (error) {
      showMessage(`Erro ao carregar o áudio de: ${title}.`, true)
    }
  }

  const renderList = (title, songs, isRacional) => {
    return (
      <div className="mb-8 sm:mb-10 animate-fade-in">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className={`w-1 h-6 sm:h-8 rounded-full ${isRacional ? 'bg-gradient-to-b from-rjb-yellow to-yellow-500' : 'bg-gradient-to-b from-gray-400 to-gray-500'}`}></div>
          <h3 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold ${isRacional ? 'text-rjb-yellow' : 'text-rjb-text/90 dark:text-rjb-text-dark/90'} transition-colors duration-500 break-words`}>
            {title}
          </h3>
        </div>
        <ul className="space-y-2 sm:space-y-3">
          {songs.map((song, idx) => (
            <li
              key={idx}
              className={`group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 hover:from-rjb-yellow/10 hover:via-rjb-yellow/5 hover:to-transparent dark:hover:from-rjb-yellow/20 dark:hover:via-rjb-yellow/10 dark:hover:to-transparent transition-all duration-300 shadow-md hover:shadow-xl border-l-4 ${isRacional ? 'border-rjb-yellow' : 'border-rjb-text/30 dark:border-rjb-text-dark/30'} transform hover:scale-[1.01] hover:-translate-y-0.5 animate-fade-in`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0 w-full sm:w-auto">
                <button
                  onClick={() => togglePlay(song.title, song.mp3, isRacional)}
                  className={`group/btn flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 touch-manipulation ${
                    playingButton === song.title
                      ? 'bg-gradient-to-br from-rjb-yellow to-yellow-500 text-white shadow-lg'
                      : 'bg-gradient-to-br from-rjb-yellow/20 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:to-rjb-yellow/5 text-rjb-yellow hover:from-rjb-yellow/30 hover:to-rjb-yellow/20'
                  }`}
                  aria-label={`Tocar ${song.title}`}
                >
                  {playingButton === song.title ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                    </svg>
                  )}
                </button>
                <span className="text-sm sm:text-base md:text-lg font-semibold text-rjb-text dark:text-rjb-text-dark group-hover:text-rjb-yellow transition-colors duration-300 truncate flex-1 min-w-0">
                  {song.title}
                </span>
              </div>
              <span className={`text-xs sm:text-sm md:text-base font-medium px-2 sm:px-3 py-1 rounded-lg flex-shrink-0 self-end sm:self-auto ${
                isRacional
                  ? 'bg-rjb-yellow/20 text-rjb-yellow'
                  : 'bg-rjb-text/10 dark:bg-rjb-text-dark/10 text-rjb-text/70 dark:text-rjb-text-dark/70'
              }`}>
                {song.time}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <PageWrapper>
      <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {renderList('Músicas Racionais 🎧', racionais, true)}
          {renderList('Outros Clássicos 🎷', diversas, false)}
        </div>
        <div className="text-center mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-rjb-yellow/20">
          <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 italic text-sm sm:text-base md:text-lg px-2">
            Nosso repertório está em constante expansão e renovação.
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}

export default Repertorio
