import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const OnboardingTour = () => {
  const [currentStep, setCurrentStep] = useState(null)
  const [isActive, setIsActive] = useState(false)
  const location = useLocation()

  const hasSeenTour = localStorage.getItem('rjb-tour-completed') === 'true'

  const tourSteps = {
    '/': [
      {
        target: 'header',
        title: 'Bem-vindo à Racional Jazz Band!',
        content: 'Este é o menu principal. Use-o para navegar pelo site.',
        position: 'bottom'
      },
      {
        target: '[data-tour="hero-buttons"]',
        title: 'Explore nosso conteúdo',
        content: 'Clique nos botões para conhecer nossas apresentações ou nossa história.',
        position: 'top'
      }
    ],
    '/partituras': [
      {
        target: '[data-tour="search"]',
        title: 'Busca de Partituras',
        content: 'Use a busca para encontrar partituras rapidamente.',
        position: 'bottom'
      }
    ],
    '/relatorios': [
      {
        target: '[data-tour="stats"]',
        title: 'Dashboard Administrativo',
        content: 'Aqui você pode ver estatísticas e gerenciar membros.',
        position: 'bottom'
      }
    ]
  }

  useEffect(() => {
    if (!hasSeenTour && tourSteps[location.pathname]) {
      const timer = setTimeout(() => {
        setIsActive(true)
        setCurrentStep(0)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [location.pathname, hasSeenTour])

  const currentSteps = tourSteps[location.pathname] || []

  const handleNext = () => {
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setIsActive(false)
    setCurrentStep(null)
    localStorage.setItem('rjb-tour-completed', 'true')
  }

  if (!isActive || currentStep === null || !currentSteps[currentStep]) {
    return null
  }

  const step = currentSteps[currentStep]
  const targetElement = document.querySelector(step.target)

  if (!targetElement) {
    return null
  }

  const rect = targetElement.getBoundingClientRect()
  const scrollY = window.scrollY
  const scrollX = window.scrollX

  const positions = {
    top: { top: rect.top + scrollY - 10, left: rect.left + scrollX + rect.width / 2 },
    bottom: { top: rect.bottom + scrollY + 10, left: rect.left + scrollX + rect.width / 2 },
    left: { top: rect.top + scrollY + rect.height / 2, left: rect.left + scrollX - 10 },
    right: { top: rect.top + scrollY + rect.height / 2, left: rect.right + scrollX + 10 }
  }

  const position = positions[step.position] || positions.bottom

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] animate-fade-in"
        onClick={handleSkip}
      />
      
      <div
        className="fixed z-[91] bg-gradient-to-br from-rjb-card-light to-rjb-card-light/95 dark:from-rjb-card-dark dark:to-rjb-card-dark/95 rounded-2xl shadow-2xl border-2 border-rjb-yellow/50 p-6 max-w-sm animate-fade-in"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-50%, 0)'
        }}
      >
        <div className="mb-4">
          <h3 className="text-xl font-bold text-rjb-text dark:text-rjb-text-dark mb-2">
            {step.title}
          </h3>
          <p className="text-sm text-rjb-text/70 dark:text-rjb-text-dark/70">
            {step.content}
          </p>
        </div>
        
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="text-sm text-rjb-text/60 dark:text-rjb-text-dark/60 hover:text-rjb-text dark:hover:text-rjb-text-dark transition-colors"
          >
            Pular tour
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-rjb-text/60 dark:text-rjb-text-dark/60">
              {currentStep + 1} de {currentSteps.length}
            </span>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gradient-to-r from-rjb-yellow to-yellow-500 text-rjb-text font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105 active:scale-95"
            >
              {currentStep < currentSteps.length - 1 ? 'Próximo' : 'Concluir'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default OnboardingTour
