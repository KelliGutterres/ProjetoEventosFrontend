import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import auditLogger from '../services/auditLogger'

/**
 * Hook para registrar rotas acessadas para auditoria
 */
export const useAuditRoute = () => {
  const location = useLocation()

  useEffect(() => {
    // Registrar rota acessada
    auditLogger.logRoute(location.pathname, location.search).catch(err => {
      console.error('Erro ao registrar rota no log de auditoria:', err)
    })
  }, [location.pathname, location.search])
}

export default useAuditRoute

