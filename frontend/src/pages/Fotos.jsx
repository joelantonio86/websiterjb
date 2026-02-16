import { useState, useEffect } from 'react'
import PageWrapper from '../components/PageWrapper'
import ImageModal from '../components/ImageModal'
import EmptyState from '../components/EmptyState'
import { PHOTOS_BY_EVENT } from '../data/photos'

const Fotos = () => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const sortedEvents = [...PHOTOS_BY_EVENT].sort((a, b) => {
    return new Date(b.date) - new Date(a.date)
  })

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const openModal = (imageUrl) => {
    setSelectedImage(imageUrl)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedImage(null), 300)
  }

  return (
    <>
      <PageWrapper>
        <div className={`space-y-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          <div className="text-center mb-8">
            <p className="text-lg sm:text-xl text-rjb-text/80 dark:text-rjb-text-dark/80 max-w-3xl mx-auto leading-relaxed">
              Uma galeria de momentos capturados em nossos shows, ensaios e eventos, organizados por apresentação.
            </p>
          </div>
          
          {sortedEvents.map((event, eventIndex) => (
            <div
              key={eventIndex}
              className="bg-gradient-to-br from-rjb-card-light via-rjb-card-light/98 to-rjb-card-light/95 dark:from-rjb-card-dark dark:via-rjb-card-dark/98 dark:to-rjb-card-dark/95 rounded-2xl border border-rjb-yellow/10 shadow-xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] animate-fade-in"
              style={{ animationDelay: `${eventIndex * 100}ms` }}
            >
              {/* Cabeçalho do Evento */}
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
                        <span className="font-medium">{event.dateFormatted}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-rjb-bg-light/50 dark:bg-rjb-bg-dark/50 rounded-lg">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rjb-yellow/30 to-rjb-yellow/20 dark:from-rjb-yellow/20 dark:to-rjb-yellow/10 rounded-xl flex-shrink-0 shadow-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rjb-yellow flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span className="text-sm sm:text-base font-bold text-rjb-text dark:text-rjb-text-dark whitespace-nowrap">
                      {event.photos.length} {event.photos.length === 1 ? 'foto' : 'fotos'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Grid de Fotos */}
              {event.photos.length > 0 && (
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                    {event.photos.map((url, photoIndex) => (
                      <div
                        key={photoIndex}
                        onClick={() => openModal(url)}
                        className="group relative overflow-hidden rounded-xl shadow-lg aspect-square transition-all duration-500 hover:shadow-2xl cursor-pointer transform hover:scale-[1.05] hover:-translate-y-1 animate-fade-in"
                        style={{ animationDelay: `${(eventIndex * 100) + (photoIndex * 30)}ms` }}
                      >
                        <img
                          src={url}
                          alt={`${event.eventTitle} - Foto ${photoIndex + 1}`}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {sortedEvents.length === 0 || sortedEvents.every(e => e.photos.length === 0) ? (
            <EmptyState
              icon={
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              }
              title="Galeria em Construção"
              description="Nossa galeria de fotos está sendo atualizada. Em breve você poderá ver todos os momentos especiais dos nossos shows e eventos!"
              variant="info"
            />
          ) : null}
        </div>
      </PageWrapper>

      <ImageModal imageUrl={selectedImage} isOpen={isModalOpen} onClose={closeModal} />
    </>
  )
}

export default Fotos
