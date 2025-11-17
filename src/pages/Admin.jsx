import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { inscricoesAPI } from '../services/api'

function Admin({ setIsAuthenticated }) {
  const [inscricoes, setInscricoes] = useState([])
  const [inscricoesFiltradas, setInscricoesFiltradas] = useState([])
  const [filtroNome, setFiltroNome] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    carregarInscricoes()
  }, [])

  useEffect(() => {
    if (filtroNome) {
      const filtrado = inscricoes.filter((inscricao) => {
        const nomeParticipante = inscricao.usuario?.nome || 
                                 inscricao.usuario?.name || 
                                 'Participante sem nome'
        return nomeParticipante.toLowerCase().includes(filtroNome.toLowerCase())
      })
      setInscricoesFiltradas(filtrado)
    } else {
      setInscricoesFiltradas(inscricoes)
    }
  }, [filtroNome, inscricoes])

  const carregarInscricoes = async () => {
    try {
      setLoading(true)
      const response = await inscricoesAPI.listarTodas()
      if (response.success) {
        setInscricoes(response.data || [])
        setInscricoesFiltradas(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar inscrições:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userData')
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    navigate('/login')
  }

  const formatarData = (data) => {
    if (!data) return 'N/A'
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const userData = JSON.parse(localStorage.getItem('userData') || '{}')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-sm text-gray-600">
                Olá, {userData.nome || 'Admin'}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtro */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label
              htmlFor="filtro"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Filtrar por Nome do Participante
            </label>
            <input
              id="filtro"
              type="text"
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="Digite o nome do participante..."
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando inscrições...</p>
          </div>
        ) : inscricoesFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600">
              {filtroNome
                ? 'Nenhuma inscrição encontrada com este nome'
                : 'Nenhuma inscrição encontrada'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data de Inscrição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Presença
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inscricoesFiltradas.map((inscricao) => (
                    <tr key={inscricao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inscricao.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inscricao.usuario?.nome || 
                         inscricao.usuario?.name || 
                         `ID: ${inscricao.usuario_id || 'N/A'}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inscricao.evento?.descricao || 
                         `Evento ID: ${inscricao.evento_id || 'N/A'}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatarData(inscricao.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {inscricao.presenca_confirmada ? (
                          <span className="px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded">
                            Confirmada
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded">
                            Pendente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Admin

