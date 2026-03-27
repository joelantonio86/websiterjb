import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
import Partituras from './pages/Partituras'
import Player from './pages/Player'
import Fotos from './pages/Fotos'
import Agenda from './pages/Agenda'
import RepertorioApresentacoes from './pages/RepertorioApresentacoes'
import Contato from './pages/Contato'
import PoliticaPrivacidade from './pages/PoliticaPrivacidade'
import TermosUso from './pages/TermosUso'
import MemberRegistration from './pages/MemberRegistration'
import Financeiro from './pages/Financeiro'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminInvites from './pages/admin/AdminInvites'
import AdminMembers from './pages/admin/AdminMembers'
import AdminMedia from './pages/admin/AdminMedia'

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
                <Route path="/repertorio" element={<Navigate to="/player" replace />} />
                <Route path="/partituras" element={<Partituras />} />
                <Route path="/player" element={<Player />} />
                <Route path="/fotos" element={<Fotos />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/repertorio-apresentacoes" element={<RepertorioApresentacoes />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/termos-uso" element={<TermosUso />} />
                <Route path="/cadastro" element={<MemberRegistration />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="convites" element={<AdminInvites />} />
                  <Route path="membros" element={<AdminMembers />} />
                  <Route path="midia" element={<AdminMedia />} />
                </Route>
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
