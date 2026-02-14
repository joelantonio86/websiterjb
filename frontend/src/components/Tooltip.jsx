import { useState } from 'react'

const Tooltip = ({ children, content, position = 'top', delay = 200 }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState(null)

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay)
    setTimeoutId(id)
  }

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    setIsVisible(false)
  }

  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  }

  const arrows = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-rjb-card-dark dark:border-t-rjb-card-dark',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-rjb-card-dark dark:border-b-rjb-card-dark',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-rjb-card-dark dark:border-l-rjb-card-dark',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-rjb-card-dark dark:border-r-rjb-card-dark'
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <div
          className={`absolute z-50 ${positions[position]} px-3 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-lg shadow-2xl whitespace-nowrap animate-fade-in pointer-events-none`}
          role="tooltip"
        >
          {content}
          <div className={`absolute w-0 h-0 border-4 border-transparent ${arrows[position]}`}></div>
        </div>
      )}
    </div>
  )
}

export default Tooltip
