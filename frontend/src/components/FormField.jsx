import { useState } from 'react'

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  placeholder,
  icon,
  validation,
  showValidation = true,
  className = '',
  ...props
}) => {
  const [touched, setTouched] = useState(false)
  const [focused, setFocused] = useState(false)

  const handleBlur = (e) => {
    setTouched(true)
    setFocused(false)
    if (onBlur) onBlur(e)
  }

  const handleFocus = () => {
    setFocused(true)
  }

  const validateField = () => {
    if (!showValidation || !touched) return null
    
    if (required && !value) {
      return 'Este campo é obrigatório'
    }

    if (validation) {
      return validation(value)
    }

    return error || null
  }

  const fieldError = validateField()
  const hasError = fieldError !== null

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-xs sm:text-sm font-semibold text-rjb-text dark:text-rjb-text-dark flex items-center gap-2"
        >
          {icon && <span className="text-rjb-yellow">{icon}</span>}
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
            <span className="text-rjb-yellow/60">{icon}</span>
          </div>
        )}
        
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className={`w-full ${icon ? 'pl-10 sm:pl-12' : 'pl-3 sm:pl-4'} pr-3 sm:pr-4 py-3 sm:py-4 text-base rounded-lg sm:rounded-xl border-2 transition-all duration-300 bg-rjb-bg-light dark:bg-rjb-bg-dark text-rjb-text dark:text-rjb-text-dark placeholder:text-rjb-text/40 dark:placeholder:text-rjb-text-dark/40 ${
            hasError
              ? 'border-red-500 ring-2 ring-red-500/20'
              : focused
              ? 'border-rjb-yellow ring-2 sm:ring-4 ring-rjb-yellow/20'
              : 'border-rjb-yellow/30 hover:border-rjb-yellow/50'
          }`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
          {...props}
        />
        
        {touched && (
          <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
            {hasError ? (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            ) : value && (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
          </div>
        )}
      </div>
      
      {hasError && (
        <p 
          id={`${name}-error`}
          className="text-xs sm:text-sm text-red-500 flex items-center gap-1 animate-fade-in"
          role="alert"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {fieldError}
        </p>
      )}
    </div>
  )
}

export default FormField
