const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  variant = 'default' 
}) => {
  const variants = {
    default: {
      iconBg: 'bg-rjb-yellow/20 dark:bg-rjb-yellow/10',
      iconColor: 'text-rjb-yellow',
      titleColor: 'text-rjb-text dark:text-rjb-text-dark',
      descColor: 'text-rjb-text/70 dark:text-rjb-text-dark/70'
    },
    error: {
      iconBg: 'bg-red-500/20 dark:bg-red-500/10',
      iconColor: 'text-red-500',
      titleColor: 'text-red-600 dark:text-red-400',
      descColor: 'text-rjb-text/70 dark:text-rjb-text-dark/70'
    },
    info: {
      iconBg: 'bg-blue-500/20 dark:bg-blue-500/10',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-600 dark:text-blue-400',
      descColor: 'text-rjb-text/70 dark:text-rjb-text-dark/70'
    }
  }

  const style = variants[variant] || variants.default

  return (
    <div className="text-center py-12 sm:py-16 animate-fade-in">
      <div className={`inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full ${style.iconBg} mb-6 animate-bounce`}>
        {icon || (
          <svg className={`w-10 h-10 sm:w-12 sm:h-12 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
          </svg>
        )}
      </div>
      <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold ${style.titleColor} mb-3 sm:mb-4 px-2`}>
        {title || 'Nenhum item encontrado'}
      </h3>
      {description && (
        <p className={`text-base sm:text-lg ${style.descColor} mb-6 sm:mb-8 max-w-md mx-auto px-4 leading-relaxed`}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-bold py-3 px-6 rounded-full hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl touch-manipulation"
        >
          {actionLabel}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
          </svg>
        </button>
      )}
    </div>
  )
}

export default EmptyState
