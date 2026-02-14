import { useEffect, useState } from 'react'
import PageWrapper from '../components/PageWrapper'
import VideoCard from '../components/VideoCard'
import { APRESENTACOES_BY_EVENT } from '../data/videos'

const Apresentacoes = () => {
  const [isVisible, setIsVisible] = useState(false)
  const sortedEvents = [...APRESENTACOES_BY_EVENT].sort((a, b) => {
    return new Date(b.date) - new Date(a.date)
  })

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <PageWrapper>
      <div className={`space-y-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="text-center mb-8">
          <p className="text-lg sm:text-xl text-rjb-text/80 dark:text-rjb-text-dark/80 max-w-3xl mx-auto leading-relaxed">
            Assista aos nossos principais shows e apresentações de grande público. Experiências sonoras e visuais completas da Racional Jazz Band, organizadas por data.
          </p>
        </div>
        
        {sortedEvents.map((event, eventIndex) => (
          <div
            key={eventIndex}
            className="bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 rounded-2xl border border-rjb-yellow/10 shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] animate-fade-in"
            style={{ animationDelay: `${eventIndex * 100}ms` }}
          >
            <div className="bg-gradient-to-r from-rjb-yellow/20 via-rjb-yellow/15 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:via-rjb-yellow/5 dark:to-rjb-yellow/5 p-4 sm:p-5 md:p-6 border-b border-rjb-yellow/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-rjb-text dark:text-rjb-text-dark mb-2 break-words">
                    {event.eventTitle}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base text-rjb-text/70 dark:text-rjb-text-dark/70">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rjb-bg-light/50 dark:bg-rjb-bg-dark/50 rounded-lg">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span className="font-medium break-words">{event.dateFormatted}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rjb-bg-light/50 dark:bg-rjb-bg-dark/50 rounded-lg">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span className="break-words">{event.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rjb-yellow/30 to-rjb-yellow/20 dark:from-rjb-yellow/20 dark:to-rjb-yellow/10 rounded-xl flex-shrink-0 shadow-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rjb-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-sm sm:text-base font-bold text-rjb-text dark:text-rjb-text-dark whitespace-nowrap">
                    {event.videos.length} {event.videos.length === 1 ? 'vídeo' : 'vídeos'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-5 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {event.videos.map((video, idx) => (
                  <div
                    key={idx}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(eventIndex * 100) + (idx * 50)}ms` }}
                  >
                    <VideoCard video={video} date={event.dateFormatted} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        
        {sortedEvents.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-lg sm:text-xl">Nenhum vídeo cadastrado ainda.</p>
          </div>
        )}
        
        <div className="text-center mt-10 pt-8 border-t border-rjb-yellow/20">
          <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 text-base sm:text-lg">
            Assista a mais performances no nosso canal oficial do YouTube.
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}

export default Apresentacoes
