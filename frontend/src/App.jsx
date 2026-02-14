import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { AudioProvider } from './contexts/AudioContext'
import Layout from './components/Layout/Layout'
import ErrorBoundary from './pages/ErrorBoundary'
import NotFound from './pages/NotFound'
import Home from './pages/Home'
import Sobre from './pages/Sobre'
import Apresentacoes from './pages/Apresentacoes'
import Bastidores from './pages/Bastidores'
import Repertorio from './pages/Repertorio'
import Partituras from './pages/Partituras'
import Player from './pages/Player'
import Fotos from './pages/Fotos'
import Agenda from './pages/Agenda'
import Contato from './pages/Contato'
import MemberRegistration from './pages/MemberRegistration'
import Reports from './pages/Reports'
import Financeiro from './pages/Financeiro'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AudioProvider>
            <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="/apresentacoes" element={<Apresentacoes />} />
                <Route path="/bastidores" element={<Bastidores />} />
                <Route path="/repertorio" element={<Repertorio />} />
                <Route path="/partituras" element={<Partituras />} />
                <Route path="/player" element={<Player />} />
                <Route path="/fotos" element={<Fotos />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/cadastro" element={<MemberRegistration />} />
                <Route path="/relatorios" element={<Reports />} />
                <Route 
                  path="/financeiro" 
                  element={
                    <ProtectedRoute requiredRole={['financeiro', 'admin-financeiro', 'financeiro-view']}>
                      <Financeiro />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </Router>
          </AudioProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
