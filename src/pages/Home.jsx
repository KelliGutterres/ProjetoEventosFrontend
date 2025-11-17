import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventosAPI, emailAPI } from '../services/api'

function Home({ setIsAuthenticated }) {
  const [eventos, setEventos] = useState([])
  const [eventosFiltrados, setEventosFiltrados] = useState([])
  const [filtroId, setFiltroId] = useState('')
  const [loading, setLoading] = useState(true)
  const [inscrevendo, setInscrevendo] = useState(null)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    carregarEventos()
  }, [])

  useEffect(() => {
    if (filtroId) {
      const filtrado = eventos.filter((evento) =>
        evento.id.toString().includes(filtroId)
      )
      setEventosFiltrados(filtrado)
    } else {
      setEventosFiltrados(eventos)
    }
  }, [filtroId, eventos])

  const carregarEventos = async () => {
    try {
      setLoading(true)
      const response = await eventosAPI.listar()
      if (response.success) {
        setEventos(response.data)
        setEventosFiltrados(response.data)
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInscrever = async (eventoId) => {
    try {
      setInscrevendo(eventoId)
      setMessage('')
      
      // Pegar o ID do usuário do localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userId = userData.id
      
      if (!userId) {
        setMessage('Erro: Usuário não identificado. Faça login novamente.')
        setTimeout(() => setMessage(''), 5000)
        return
      }
      
      const response = await eventosAPI.inscrever(eventoId, userId)
      if (response.success) {
        // Enviar email de inscrição
        try {
          await emailAPI.enviarInscricao(userId, eventoId)
          console.log('Email de inscrição enviado com sucesso')
        } catch (emailError) {
          // Não bloquear o fluxo se o email falhar, apenas logar o erro
          console.error('Erro ao enviar email de inscrição:', emailError)
        }
        
        setMessage(`Inscrição realizada com sucesso! ID: ${eventoId}`)
        setTimeout(() => setMessage(''), 5000)
      }
    } catch (error) {
      setMessage('Erro ao realizar inscrição. Tente novamente.')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setInscrevendo(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userData')
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    navigate('/login')
  }

  const formatarData = (data) => {
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
                Eventos Disponíveis
              </h1>
              <p className="text-sm text-gray-600">
                Olá, {userData.nome || 'Usuário'}!
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/minhas-inscricoes')}
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Minhas Inscrições
              </button>
              <button
                onClick={() => navigate('/validar-certificado')}
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Validar Certificado
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
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
              Filtrar por ID do Evento
            </label>
            <input
              id="filtro"
              type="text"
              value={filtroId}
              onChange={(e) => setFiltroId(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="Digite o ID do evento..."
            />
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando eventos...</p>
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-600">
              {filtroId
                ? 'Nenhum evento encontrado com este ID'
                : 'Nenhum evento disponível no momento'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {eventosFiltrados.map((evento) => (
              <div
                key={evento.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {evento.descricao}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatarData(evento.data_inicio)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Até {formatarData(evento.data_final)}
                      </div>
                    </div>
                    {evento.cancelado === 1 && (
                      <span className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded">
                        Cancelado
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleInscrever(evento.id)}
                      disabled={
                        inscrevendo === evento.id || evento.cancelado === 1
                      }
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {inscrevendo === evento.id
                        ? 'Inscrevendo...'
                        : evento.cancelado === 1
                        ? 'Evento Cancelado'
                        : 'Inscrever-se'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Home

