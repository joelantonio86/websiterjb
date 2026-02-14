import { useNavigate } from 'react-router-dom'
import EmptyState from '../components/EmptyState'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <EmptyState
          icon={
            <svg className="w-20 h-20 sm:w-24 sm:h-24 text-rjb-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          }
          title="404 - Página Não Encontrada"
          description="Ops! A página que você está procurando não existe ou foi movida. Que tal voltar para a página inicial?"
          actionLabel="Voltar para Home"
          onAction={() => navigate('/')}
          variant="info"
        />
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { path: '/', label: 'Home', icon: '🏠' },
            { path: '/sobre', label: 'Sobre', icon: '📖' },
            { path: '/apresentacoes', label: 'Vídeos', icon: '🎬' },
            { path: '/agenda', label: 'Agenda', icon: '📅' }
          ].map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="p-4 rounded-xl bg-gradient-to-br from-rjb-card-light to-rjb-card-light/95 dark:from-rjb-card-dark dark:to-rjb-card-dark/95 hover:from-rjb-yellow/10 hover:to-rjb-yellow/5 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <div className="text-2xl mb-2">{link.icon}</div>
              <div className="text-sm font-medium text-rjb-text dark:text-rjb-text-dark">{link.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NotFound
