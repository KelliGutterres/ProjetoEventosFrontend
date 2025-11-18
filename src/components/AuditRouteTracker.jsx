import { useAuditRoute } from '../hooks/useAuditRoute'

/**
 * Componente para rastrear rotas acessadas
 * Deve ser usado dentro do Router
 */
const AuditRouteTracker = () => {
  useAuditRoute()
  return null
}

export default AuditRouteTracker

