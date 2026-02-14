import { Component } from 'react'
import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'

class ErrorBoundaryClass extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

const ErrorFallback = ({ error }) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <EmptyState
          icon={
            <svg className="w-20 h-20 sm:w-24 sm:h-24 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          }
          title="500 - Erro no Servidor"
          description="Algo deu errado! Nossa equipe foi notificada e está trabalhando para resolver o problema. Tente novamente em alguns instantes."
          actionLabel="Voltar para Home"
          onAction={() => {
            window.location.href = '/'
          }}
          variant="error"
        />
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
            <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
              {error.toString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorBoundaryClass
