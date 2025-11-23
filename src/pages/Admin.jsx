import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { inscricoesAPI, presencasAPI, eventosAPI, usuariosAPI, emailAPI } from '../services/api'
import CadastroRapidoModal from '../components/CadastroRapidoModal'

function Admin({ setIsAuthenticated }) {
  const [inscricoes, setInscricoes] = useState([])
  const [inscricoesFiltradas, setInscricoesFiltradas] = useState([])
  const [eventos, setEventos] = useState([])
  const [eventosFiltrados, setEventosFiltrados] = useState([])
  const [filtroNome, setFiltroNome] = useState('')
  const [filtroEvento, setFiltroEvento] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingEventos, setLoadingEventos] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showCadastroModal, setShowCadastroModal] = useState(false)
  const [eventoSelecionado, setEventoSelecionado] = useState(null)
  const [eventoDetalhes, setEventoDetalhes] = useState(null)
  const [abaAtiva, setAbaAtiva] = useState('inscricoes') // 'inscricoes' ou 'eventos'
  const navigate = useNavigate()

  useEffect(() => {
    carregarInscricoes()
    carregarEventos()
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

  useEffect(() => {
    if (filtroEvento) {
      const filtrado = eventos.filter((evento) =>
        evento.id.toString().includes(filtroEvento) ||
        evento.descricao?.toLowerCase().includes(filtroEvento.toLowerCase())
      )
      setEventosFiltrados(filtrado)
    } else {
      setEventosFiltrados(eventos)
    }
  }, [filtroEvento, eventos])

  const carregarInscricoes = async () => {
    try {
      setLoading(true)
      const response = await inscricoesAPI.listarTodas()
      if (response.success) {
        const inscricoesData = response.data || []
        // Log para debug - remover depois se necessário
        console.log('Inscrições carregadas:', inscricoesData)
        setInscricoes(inscricoesData)
        setInscricoesFiltradas(inscricoesData)
      }
    } catch (error) {
      console.error('Erro ao carregar inscrições:', error)
    } finally {
      setLoading(false)
    }
  }

  const carregarEventos = async () => {
    try {
      setLoadingEventos(true)
      const response = await eventosAPI.listar()
      if (response.success) {
        setEventos(response.data || [])
        setEventosFiltrados(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error)
    } finally {
      setLoadingEventos(false)
    }
  }

  const handleInscreverEvento = (evento) => {
    setEventoSelecionado(evento)
    setShowCadastroModal(true)
  }

  const handleCadastroCompleto = async (dadosUsuario) => {
    try {
      // 1. Criar usuário
      const responseUsuario = await usuariosAPI.criar(dadosUsuario)
      
      if (!responseUsuario.success) {
        const errorMessage = responseUsuario.message || 
                            responseUsuario.error?.message ||
                            'Erro ao cadastrar usuário'
        setMessage({
          type: 'error',
          text: errorMessage,
        })
        return
      }

      // Obter ID do usuário (pode ser local se offline)
      // A API retorna { data: { id: ... } } ou { data: { data: { id: ... } } }
      const userId = responseUsuario.data?.id || responseUsuario.data?.data?.id
      const isUsuarioOffline = responseUsuario.offline || false
      
      if (!userId) {
        setMessage({
          type: 'error',
          text: 'Erro: ID do usuário não foi retornado pela API',
        })
        return
      }
      
      // Se estiver offline, usar o ID local diretamente (já vem no formato correto)
      // Se estiver online, usar o ID do servidor
      const userIdParaInscricao = userId

      // 2. Realizar inscrição
      const responseInscricao = await eventosAPI.inscrever(eventoSelecionado.id, userIdParaInscricao)
      
      if (!responseInscricao.success) {
        const errorMessage = responseInscricao.message || 
                            responseInscricao.error?.message ||
                            'Erro ao realizar inscrição'
        setMessage({
          type: 'error',
          text: errorMessage,
        })
        return
      }

      // Obter ID da inscrição
      const inscricaoId = responseInscricao.data?.id || responseInscricao.data?.data?.id
      const isInscricaoOffline = responseInscricao.offline || false
      
      if (!inscricaoId) {
        setMessage({
          type: 'error',
          text: 'Erro: ID da inscrição não foi retornado pela API',
        })
        return
      }
      
      // Enviar email de inscrição (apenas se estiver online e não for offline)
      if (!isInscricaoOffline && !isUsuarioOffline) {
        try {
          // Usar o ID do servidor para o email (userId já é do servidor se não estiver offline)
          const userIdServidor = isUsuarioOffline ? null : userId
          if (userIdServidor) {
            await emailAPI.enviarInscricao(userIdServidor, eventoSelecionado.id)
            console.log('Email de inscrição enviado com sucesso')
          }
        } catch (emailError) {
          // Não bloquear o fluxo se o email falhar, apenas logar o erro
          console.error('Erro ao enviar email de inscrição:', emailError)
        }
      }
      
      // Se estiver offline, usar o ID local diretamente
      // Se estiver online, usar o ID do servidor
      const inscricaoIdParaPresenca = inscricaoId

      // 3. Registrar presença
      const responsePresenca = await presencasAPI.registrar(inscricaoIdParaPresenca)
      
      if (!responsePresenca.success) {
        const errorMessage = responsePresenca.message || 
                            responsePresenca.error?.message ||
                            'Erro ao registrar presença'
        setMessage({
          type: 'error',
          text: errorMessage,
        })
        return
      }

      const isPresencaOffline = responsePresenca.offline || false

      // Enviar email de presença (apenas se estiver online e não for offline)
      if (!isPresencaOffline && !isUsuarioOffline && !isInscricaoOffline) {
        try {
          // Usar o ID do servidor para o email (userId já é do servidor se não estiver offline)
          const userIdServidor = isUsuarioOffline ? null : userId
          if (userIdServidor) {
            await emailAPI.enviarPresenca(userIdServidor, eventoSelecionado.id)
            console.log('Email de presença enviado com sucesso')
          }
        } catch (emailError) {
          // Não bloquear o fluxo se o email falhar, apenas logar o erro
          console.error('Erro ao enviar email de presença:', emailError)
        }
      }

      // Sucesso!
      setMessage({
        type: 'success',
        text: isUsuarioOffline || isInscricaoOffline || isPresencaOffline
          ? 'Usuário cadastrado, inscrito e presença registrada offline! Será sincronizado quando voltar online.'
          : 'Usuário cadastrado, inscrito e presença registrada com sucesso!',
      })

      // Fechar modal e recarregar dados
      setShowCadastroModal(false)
      setEventoSelecionado(null)
      
      // Recarregar inscrições após um breve delay
      setTimeout(() => {
        carregarInscricoes()
      }, 1000)

    } catch (error) {
      console.error('Erro no fluxo completo:', error)
      console.error('Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      })
      
      // Extrair mensagem de erro mais específica
      let errorMessage = 'Erro ao processar. Tente novamente.'
      
      if (error.response?.data) {
        // Tentar diferentes formatos de resposta de erro
        errorMessage = error.response.data.message || 
                      error.response.data.error?.message ||
                      error.response.data.error ||
                      (typeof error.response.data === 'string' ? error.response.data : errorMessage)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    }
  }

  const handleRegistrarPresenca = async (inscricaoId) => {
    try {
      setProcessando(inscricaoId)
      setMessage({ type: '', text: '' })

      // Buscar a inscrição para obter os dados do usuário e evento
      const inscricao = inscricoes.find((i) => i.id === inscricaoId)
      if (!inscricao) {
        setMessage({
          type: 'error',
          text: 'Inscrição não encontrada.',
        })
        return
      }

      // Obter IDs do usuário e evento
      const userId = inscricao.usuario_id || inscricao.usuario?.id || inscricao.email_usuario
      const eventoId = inscricao.evento_id || inscricao.evento?.id

      const response = await presencasAPI.registrar(inscricaoId)
      if (response.success) {
        // Enviar email de presença (apenas se estiver online e não for offline)
        const isPresencaOffline = response.offline || false
        if (!isPresencaOffline && userId && eventoId) {
          try {
            await emailAPI.enviarPresenca(userId, eventoId)
            console.log('Email de presença enviado com sucesso')
          } catch (emailError) {
            // Não bloquear o fluxo se o email falhar, apenas logar o erro
            console.error('Erro ao enviar email de presença:', emailError)
          }
        }

        setMessage({
          type: 'success',
          text: 'Presença registrada com sucesso!',
        })
        
        // Atualizar o estado local imediatamente
        const presencaId = response.data?.id || response.data?.presenca_id
        setInscricoes((prevInscricoes) =>
          prevInscricoes.map((inscricao) =>
            inscricao.id === inscricaoId
              ? { 
                  ...inscricao, 
                  presenca_confirmada: true,
                  presenca_id: presencaId,
                  presenca: presencaId ? { id: presencaId } : undefined
                }
              : inscricao
          )
        )
        setInscricoesFiltradas((prevInscricoes) =>
          prevInscricoes.map((inscricao) =>
            inscricao.id === inscricaoId
              ? { 
                  ...inscricao, 
                  presenca_confirmada: true,
                  presenca_id: presencaId,
                  presenca: presencaId ? { id: presencaId } : undefined
                }
              : inscricao
          )
        )
        
        // Recarregar as inscrições para garantir que os dados estão atualizados
        setTimeout(() => {
          carregarInscricoes()
        }, 1000)
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Erro ao registrar presença.',
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          'Erro ao registrar presença. Tente novamente.',
      })
    } finally {
      setProcessando(null)
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
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
        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm p-2 flex gap-2">
            <button
              onClick={() => setAbaAtiva('inscricoes')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                abaAtiva === 'inscricoes'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Inscrições
            </button>
            <button
              onClick={() => setAbaAtiva('eventos')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                abaAtiva === 'eventos'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Eventos Disponíveis
            </button>
          </div>
        </div>

        {/* Filtro - Inscrições */}
        {abaAtiva === 'inscricoes' && (
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
        )}

        {/* Filtro - Eventos */}
        {abaAtiva === 'eventos' && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <label
                htmlFor="filtroEvento"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filtrar Eventos
              </label>
              <input
                id="filtroEvento"
                type="text"
                value={filtroEvento}
                onChange={(e) => setFiltroEvento(e.target.value)}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Digite o ID ou nome do evento..."
              />
            </div>
          </div>
        )}

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 border-l-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Conteúdo da Aba de Inscrições */}
        {abaAtiva === 'inscricoes' && (
          <>
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
                            {inscricao.email_usuario || 
                             inscricao.usuario?.email ||
                             inscricao.usuario?.nome || 
                             inscricao.usuario?.name || 
                             'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {inscricao.nome_evento ||
                             inscricao.evento?.nome ||
                             inscricao.evento?.descricao || 
                             'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatarData(inscricao.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              // Verificar se a presença já foi registrada
                              const temPresenca = 
                                inscricao.presenca_confirmada === true || 
                                inscricao.presenca_confirmada === 1 ||
                                inscricao.presenca_id || 
                                inscricao.presenca?.id ||
                                inscricao.presenca
                              
                              if (temPresenca) {
                                return (
                                  <span className="px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded">
                                    Confirmada
                                  </span>
                                )
                              } else {
                                return (
                                  <button
                                    onClick={() => handleRegistrarPresenca(inscricao.id)}
                                    disabled={processando === inscricao.id}
                                    className="px-3 py-1 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {processando === inscricao.id
                                      ? 'Registrando...'
                                      : 'Registrar Presença'}
                                  </button>
                                )
                              }
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Conteúdo da Aba de Eventos */}
        {abaAtiva === 'eventos' && (
          <>
            {/* Loading */}
            {loadingEventos ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Carregando eventos...</p>
              </div>
            ) : eventosFiltrados.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <p className="text-gray-600">
                  {filtroEvento
                    ? 'Nenhum evento encontrado'
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

                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        <button
                          onClick={() => setEventoDetalhes(evento)}
                          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                        >
                          Detalhes
                        </button>
                        <button
                          onClick={() => handleInscreverEvento(evento)}
                          disabled={evento.cancelado === 1}
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {evento.cancelado === 1 ? 'Evento Cancelado' : 'Inscrever-se'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal de Cadastro Rápido */}
        {showCadastroModal && eventoSelecionado && (
          <CadastroRapidoModal
            evento={eventoSelecionado}
            onClose={() => {
              setShowCadastroModal(false)
              setEventoSelecionado(null)
            }}
            onSuccess={handleCadastroCompleto}
          />
        )}

        {/* Modal de Detalhes do Evento */}
        {eventoDetalhes && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Detalhes do Evento</h2>
                    <p className="text-sm text-gray-600 mt-1">ID: {eventoDetalhes.id}</p>
                  </div>
                  <button
                    onClick={() => setEventoDetalhes(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Conteúdo */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <p className="text-gray-900 text-lg font-semibold">
                      {eventoDetalhes.descricao || 'N/A'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Início
                      </label>
                      <div className="flex items-center text-gray-900">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-500"
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
                        {formatarData(eventoDetalhes.data_inicio)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Final
                      </label>
                      <div className="flex items-center text-gray-900">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-500"
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
                        {formatarData(eventoDetalhes.data_final)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Local
                      </label>
                      <div className="flex items-center text-gray-900">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {eventoDetalhes.local || 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vagas
                      </label>
                      <div className="flex items-center text-gray-900">
                        <svg
                          className="w-4 h-4 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {eventoDetalhes.vagas !== null && eventoDetalhes.vagas !== undefined
                          ? eventoDetalhes.vagas
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <div>
                        {eventoDetalhes.cancelado === 1 || eventoDetalhes.cancelado === true ? (
                          <span className="px-3 py-1 text-sm font-semibold text-red-600 bg-red-100 rounded">
                            Cancelado
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-sm font-semibold text-green-600 bg-green-100 rounded">
                            Ativo
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Criado em
                      </label>
                      <p className="text-gray-900 text-sm">
                        {formatarData(eventoDetalhes.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botão Fechar */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setEventoDetalhes(null)}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Admin

