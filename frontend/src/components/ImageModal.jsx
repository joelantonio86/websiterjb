import { useEffect } from 'react'

const ImageModal = ({ imageUrl, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !imageUrl) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4 transition-opacity duration-300 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-7xl max-h-[95vh] sm:max-h-[90vh] mx-auto group w-full"
      >
        <button
          onClick={onClose}
          className="absolute -top-10 sm:-top-12 right-0 sm:right-0 text-white hover:text-rjb-yellow transition-all duration-300 text-3xl sm:text-4xl md:text-5xl font-light z-10 p-1 sm:p-2 rounded-full hover:bg-white/10 backdrop-blur-sm transform hover:scale-110 active:scale-95 touch-manipulation"
          aria-label="Fechar imagem"
        >
          &times;
        </button>
        <div className="relative overflow-hidden rounded-lg sm:rounded-2xl shadow-2xl">
          <img
            src={imageUrl}
            alt="Imagem Ampliada"
            decoding="async"
            className="max-h-[85vh] sm:max-h-[85vh] w-auto mx-auto object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        </div>
        <p className="text-white/70 text-xs sm:text-sm mt-2 sm:mt-4 text-center">Pressione ESC para fechar</p>
      </div>
    </div>
  )
}

export default ImageModal
