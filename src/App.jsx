import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Home from './pages/Home'
import ValidarCertificado from './pages/ValidarCertificado'
import MinhasInscricoes from './pages/MinhasInscricoes'
import Admin from './pages/Admin'
import OfflineIndicator from './components/OfflineIndicator'
import { useOffline } from './hooks/useOffline'
import AuditRouteTracker from './components/AuditRouteTracker'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const { online, pendingCount, sync } = useOffline()

  useEffect(() => {
    // Verificar se há token ou dados de usuário no localStorage
    const userData = localStorage.getItem('userData')
    if (userData) {
      try {
        const data = JSON.parse(userData)
        setIsAuthenticated(true)
        setIsAdmin(data.admin === true)
      } catch (error) {
        console.error('Erro ao parsear userData:', error)
      }
    }
    setLoading(false)
  }, [])

  // Sincronizar automaticamente quando voltar online
  useEffect(() => {
    if (online && pendingCount > 0) {
      // Aguardar um pouco para garantir que a conexão está estável
      const timer = setTimeout(() => {
        sync()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [online, pendingCount, sync])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-xl text-gray-600">Carregando...</div>
      </div>
    )
  }

  return (
    <Router>
      <AuditRouteTracker />
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route
          path="/home"
          element={
            isAuthenticated ? (
              <Home setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/validar-certificado"
          element={
            isAuthenticated ? (
              <ValidarCertificado />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/minhas-inscricoes"
          element={
            isAuthenticated ? (
              <MinhasInscricoes />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            isAuthenticated && isAdmin ? (
              <Admin setIsAuthenticated={setIsAuthenticated} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
      <OfflineIndicator />
    </Router>
  )
}

export default App

