const ProgressIndicator = ({ steps, currentStep, className = '' }) => {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1 relative">
            {index < steps.length - 1 && (
              <div className={`absolute top-5 left-[50%] w-full h-0.5 ${
                index < currentStep ? 'bg-rjb-yellow' : 'bg-gray-300 dark:bg-gray-700'
              }`} style={{ zIndex: 0 }}></div>
            )}
            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              index < currentStep
                ? 'bg-rjb-yellow border-rjb-yellow text-rjb-text'
                : index === currentStep
                ? 'bg-rjb-yellow/20 border-rjb-yellow text-rjb-yellow'
                : 'bg-transparent border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600'
            }`}>
              {index < currentStep ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <span className="font-bold">{index + 1}</span>
              )}
            </div>
            <div className={`mt-2 text-xs sm:text-sm text-center ${
              index <= currentStep
                ? 'text-rjb-text dark:text-rjb-text-dark font-semibold'
                : 'text-gray-400 dark:text-gray-600'
            }`}>
              {step.label}
            </div>
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-rjb-yellow to-yellow-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}

export default ProgressIndicator
