import { useEffect } from 'react'

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger' 
}) => {
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

  if (!isOpen) return null

  const variants = {
    danger: {
      confirmBg: 'bg-red-600 hover:bg-red-700',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    warning: {
      confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    info: {
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    }
  }

  const style = variants[variant] || variants.danger

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-rjb-card-light to-rjb-card-light/95 dark:from-rjb-card-dark dark:to-rjb-card-dark/95 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform transition-all duration-300 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${style.iconBg} mb-4`}>
          {variant === 'danger' && (
            <svg className={`w-8 h-8 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          )}
          {variant === 'warning' && (
            <svg className={`w-8 h-8 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          )}
          {variant === 'info' && (
            <svg className={`w-8 h-8 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-rjb-text dark:text-rjb-text-dark mb-3">
          {title || 'Confirmar ação'}
        </h3>
        
        <p className="text-rjb-text/70 dark:text-rjb-text-dark/70 mb-6 leading-relaxed">
          {message || 'Tem certeza que deseja realizar esta ação?'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-rjb-bg-light dark:bg-rjb-bg-dark border-2 border-rjb-text/20 dark:border-rjb-text-dark/20 text-rjb-text dark:text-rjb-text-dark font-semibold rounded-xl hover:bg-rjb-text/5 dark:hover:bg-rjb-text-dark/5 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 touch-manipulation"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 px-4 py-3 ${style.confirmBg} text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-xl touch-manipulation`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationDialog
