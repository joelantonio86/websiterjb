import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/PageWrapper'
import EmptyState from '../components/EmptyState'
import { AGENDA_EVENTS } from '../data/events'

const Agenda = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <PageWrapper title="Agenda de Eventos">
      <div className={`space-y-4 sm:space-y-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
        <div className="text-center mb-6 sm:mb-10">
          <p className="text-base sm:text-lg md:text-xl text-rjb-text/80 dark:text-rjb-text-dark/80 max-w-3xl mx-auto leading-relaxed px-2">
            Confira a nossa agenda de apresentações para participar de momentos inesquecíveis de música e cultura.
          </p>
        </div>
        
        {AGENDA_EVENTS.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {AGENDA_EVENTS.map((event, index) => {
              const dateParts = event.dateString.split(' ')
              const day = dateParts[0]
              const month = dateParts[1]
              const year = dateParts[2]
              
              return (
                <div
                  key={index}
                  className="group relative flex flex-col md:flex-row items-start md:items-center p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 border-l-4 md:border-l-8 border-rjb-yellow shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01] hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-rjb-yellow/0 to-rjb-yellow/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10 flex-shrink-0 w-full md:w-32 lg:w-36 mb-3 sm:mb-4 md:mb-0 md:mr-6 lg:mr-8 text-center md:text-left">
                    <div className="inline-flex flex-col items-center md:items-start p-3 sm:p-4 bg-gradient-to-br from-rjb-yellow/20 to-rjb-yellow/10 dark:from-rjb-yellow/10 dark:to-rjb-yellow/5 rounded-lg sm:rounded-xl border border-rjb-yellow/30 shadow-lg">
                      <p className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-rjb-yellow leading-none mb-1">{day}</p>
                      <p className="text-xs sm:text-sm md:text-base font-bold text-rjb-text dark:text-rjb-text-dark uppercase tracking-wide">
                        {month}
                      </p>
                      <p className="text-xs text-rjb-text/70 dark:text-rjb-text-dark/70 mt-1">
                        {year}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative z-10 flex-grow w-full">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-rjb-text dark:text-rjb-text-dark mb-2 sm:mb-3 group-hover:text-rjb-yellow transition-colors duration-300 break-words">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm md:text-base text-rjb-text/70 dark:text-rjb-text-dark/70">
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-rjb-bg-light/50 dark:bg-rjb-bg-dark/50 rounded-lg">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span className="font-medium break-words">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-rjb-bg-light/50 dark:bg-rjb-bg-dark/50 rounded-lg">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 flex-shrink-0 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="font-medium">{/^\d{1,2}:\d{2}$/.test(event.time) ? `${event.time}h` : event.time}</span>
                      </div>
                    </div>
                    {event.link && (
                      <Link
                        to={event.link}
                        className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-rjb-yellow hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-rjb-yellow focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                        </svg>
                        Ver repertório
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            }
            title="Agenda em Atualização"
            description="Em breve, nossa agenda de eventos será atualizada aqui. Fique atento para não perder nossos próximos shows!"
            variant="info"
          />
        )}
      </div>
    </PageWrapper>
  )
}

export default Agenda
