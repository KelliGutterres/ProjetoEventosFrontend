import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { inscricoesAPI, presencasAPI, emailAPI, eventosAPI } from '../services/api'
import { getOfflineInscricoes, isOnline } from '../services/offlineService'

function MinhasInscricoes() {
  const [inscricoes, setInscricoes] = useState([])
  const [inscricoesFiltradas, setInscricoesFiltradas] = useState([])
  const [filtroId, setFiltroId] = useState('')
  const [loading, setLoading] = useState(true)
  const [processando, setProcessando] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const navigate = useNavigate()

  useEffect(() => {
    carregarInscricoes()
  }, [])

  useEffect(() => {
    if (filtroId) {
      const filtrado = inscricoes.filter((inscricao) =>
        inscricao.id.toString().includes(filtroId)
      )
      setInscricoesFiltradas(filtrado)
    } else {
      setInscricoesFiltradas(inscricoes)
    }
  }, [filtroId, inscricoes])

  const carregarInscricoes = async () => {
    try {
      setLoading(true)
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userId = userData.id

      if (!userId) {
        setMessage({
          type: 'error',
          text: 'Usuário não identificado. Faça login novamente.',
        })
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      let todasInscricoes = []
      
      // Buscar inscrições online
      if (isOnline()) {
        try {
          const response = await inscricoesAPI.listar(userId)
          if (response.success && response.data) {
            todasInscricoes = response.data
          }
        } catch (error) {
          console.error('Erro ao carregar inscrições online:', error)
        }
      }
      
      // Adicionar inscrições offline
      const inscricoesOffline = getOfflineInscricoes(userId)
      todasInscricoes = [...todasInscricoes, ...inscricoesOffline]
      
      // Buscar os dados completos dos eventos para cada inscrição
      const inscricoesComEventos = await Promise.all(
        todasInscricoes.map(async (inscricao) => {
          // Verificar se já existe presença registrada (presenca_id, presenca?.id, id_presenca, ou objeto presenca)
          const presencaId = inscricao.presenca_id || inscricao.presenca?.id || inscricao.id_presenca
          const temPresenca = !!presencaId || !!inscricao.presenca || inscricao.presenca_confirmada === true
          
          // Se já tiver o evento completo com descrição, retornar como está
          if (inscricao.evento?.descricao) {
            return {
              ...inscricao,
              presenca_confirmada: temPresenca,
              presenca_id: presencaId || inscricao.presenca_id,
            }
          }
          
          // Se não tiver, buscar o evento pelo evento_id
          const eventoId = inscricao.evento_id || inscricao.evento?.id
          if (eventoId) {
            try {
              const eventoResponse = await eventosAPI.buscarPorId(eventoId)
              if (eventoResponse.success && eventoResponse.data) {
                return {
                  ...inscricao,
                  evento: eventoResponse.data,
                  presenca_confirmada: temPresenca,
                  presenca_id: presencaId || inscricao.presenca_id,
                }
              }
            } catch (error) {
              console.error(`Erro ao buscar evento ${eventoId}:`, error)
            }
          }
          
          return {
            ...inscricao,
            presenca_confirmada: temPresenca,
            presenca_id: presencaId || inscricao.presenca_id,
          }
        })
      )
      
      setInscricoes(inscricoesComEventos)
      setInscricoesFiltradas(inscricoesComEventos)
    } catch (error) {
      console.error('Erro ao carregar inscrições:', error)
      setMessage({
        type: 'error',
        text: 'Erro ao carregar inscrições. Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegistrarPresenca = async (inscricaoId) => {
    try {
      setProcessando(`presenca-${inscricaoId}`)
      setMessage({ type: '', text: '' })

      // Buscar a inscrição para obter o evento_id e usuario_id
      const inscricao = inscricoes.find((i) => i.id === inscricaoId)
      if (!inscricao) {
        setMessage({
          type: 'error',
          text: 'Inscrição não encontrada.',
        })
        return
      }

      const eventoId = inscricao.evento_id || inscricao.evento?.id
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userId = userData.id || inscricao.usuario_id

      if (!eventoId || !userId) {
        setMessage({
          type: 'error',
          text: 'Dados da inscrição incompletos.',
        })
        return
      }

      // Atualizar o estado local imediatamente (otimistic update) para desabilitar o botão
      setInscricoes((prevInscricoes) =>
        prevInscricoes.map((inscricao) =>
          inscricao.id === inscricaoId
            ? { ...inscricao, presenca_confirmada: true }
            : inscricao
        )
      )
      setInscricoesFiltradas((prevInscricoes) =>
        prevInscricoes.map((inscricao) =>
          inscricao.id === inscricaoId
            ? { ...inscricao, presenca_confirmada: true }
            : inscricao
        )
      )

      // Registrar a presença
      const response = await presencasAPI.registrar(inscricaoId)
      if (response.success) {
        // Obter o presenca_id da resposta (pode estar em data.id, data.presenca_id, ou id)
        const presencaId = response.data?.id || response.data?.presenca_id || response.id
        
        // Enviar email de presença
        try {
          await emailAPI.enviarPresenca(userId, eventoId)
          console.log('Email de presença enviado com sucesso')
        } catch (emailError) {
          // Não bloquear o fluxo se o email falhar, apenas logar o erro
          console.error('Erro ao enviar email de presença:', emailError)
        }

        setMessage({
          type: 'success',
          text: 'Presença registrada com sucesso!',
        })
        
        // Atualizar o estado local com o presenca_id retornado pela API
        setInscricoes((prevInscricoes) =>
          prevInscricoes.map((inscricao) =>
            inscricao.id === inscricaoId
              ? { ...inscricao, presenca_confirmada: true, presenca_id: presencaId }
              : inscricao
          )
        )
        
        // Também atualizar as inscrições filtradas
        setInscricoesFiltradas((prevInscricoes) =>
          prevInscricoes.map((inscricao) =>
            inscricao.id === inscricaoId
              ? { ...inscricao, presenca_confirmada: true, presenca_id: presencaId }
              : inscricao
          )
        )
      } else {
        // Reverter o estado se a operação falhou
        setInscricoes((prevInscricoes) =>
          prevInscricoes.map((inscricao) =>
            inscricao.id === inscricaoId
              ? { ...inscricao, presenca_confirmada: false }
              : inscricao
          )
        )
        setInscricoesFiltradas((prevInscricoes) =>
          prevInscricoes.map((inscricao) =>
            inscricao.id === inscricaoId
              ? { ...inscricao, presenca_confirmada: false }
              : inscricao
          )
        )
        setMessage({
          type: 'error',
          text: response.message || 'Erro ao registrar presença.',
        })
      }
    } catch (error) {
      // Se a presença já foi registrada (erro 409), manter o estado atualizado
      if (error.response?.status === 409) {
        setInscricoes((prevInscricoes) =>
          prevInscricoes.map((inscricao) =>
            inscricao.id === inscricaoId
              ? { ...inscricao, presenca_confirmada: true }
              : inscricao
          )
        )
        setInscricoesFiltradas((prevInscricoes) =>
          prevInscricoes.map((inscricao) =>
            inscricao.id === inscricaoId
              ? { ...inscricao, presenca_confirmada: true }
              : inscricao
          )
        )
      } else {
        // Reverter o estado se houver outro erro
        setInscricoes((prevInscricoes) =>
          prevInscricoes.map((inscricao) =>
            inscricao.id === inscricaoId
              ? { ...inscricao, presenca_confirmada: false }
              : inscricao
          )
        )
        setInscricoesFiltradas((prevInscricoes) =>
          prevInscricoes.map((inscricao) =>
            inscricao.id === inscricaoId
              ? { ...inscricao, presenca_confirmada: false }
              : inscricao
          )
        )
      }
      
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

  const handleCancelarInscricao = async (inscricaoId) => {
    if (
      !window.confirm(
        'Tem certeza que deseja cancelar esta inscrição? Esta ação não pode ser desfeita.'
      )
    ) {
      return
    }

    try {
      setProcessando(`cancelar-${inscricaoId}`)
      setMessage({ type: '', text: '' })

      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userId = userData.id

      // Buscar a inscrição para obter o evento_id antes de cancelar
      const inscricao = inscricoes.find((i) => i.id === inscricaoId)
      const eventoId = inscricao?.evento_id || inscricao?.evento?.id

      const response = await inscricoesAPI.cancelar(inscricaoId)
      if (response.success) {
        // Enviar email de cancelamento
        if (eventoId) {
          try {
            await emailAPI.enviarCancelamento(userId, eventoId)
            console.log('Email de cancelamento enviado com sucesso')
          } catch (emailError) {
            // Não bloquear o fluxo se o email falhar, apenas logar o erro
            console.error('Erro ao enviar email de cancelamento:', emailError)
          }
        }
        
        setMessage({
          type: 'success',
          text: 'Inscrição cancelada com sucesso!',
        })
        // Remover a inscrição cancelada da lista
        setInscricoes(inscricoes.filter((i) => i.id !== inscricaoId))
        setInscricoesFiltradas(
          inscricoesFiltradas.filter((i) => i.id !== inscricaoId)
        )
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Erro ao cancelar inscrição.',
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          'Erro ao cancelar inscrição. Tente novamente.',
      })
    } finally {
      setProcessando(null)
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
  }

  const handleGerarCertificado = async (inscricaoId) => {
    try {
      setProcessando(`certificado-${inscricaoId}`)
      setMessage({ type: '', text: '' })

      // Buscar a inscrição para obter o presenca_id
      const inscricao = inscricoes.find((i) => i.id === inscricaoId)
      if (!inscricao) {
        setMessage({
          type: 'error',
          text: 'Inscrição não encontrada.',
        })
        return
      }

      // Obter o presenca_id da inscrição (pode estar em presenca_id, presenca?.id, ou id_presenca)
      const presencaId = inscricao.presenca_id || inscricao.presenca?.id || inscricao.id_presenca
      
      if (!presencaId) {
        setMessage({
          type: 'error',
          text: 'Presença não encontrada. Registre a presença primeiro.',
        })
        return
      }

      // Atualizar o estado local imediatamente (otimistic update) para desabilitar o botão
      setInscricoes((prevInscricoes) =>
        prevInscricoes.map((insc) =>
          insc.id === inscricaoId
            ? { ...insc, certificado_gerado: true }
            : insc
        )
      )
      setInscricoesFiltradas((prevInscricoes) =>
        prevInscricoes.map((insc) =>
          insc.id === inscricaoId
            ? { ...insc, certificado_gerado: true }
            : insc
        )
      )

      const response = await inscricoesAPI.gerarCertificado(presencaId)
      if (response.success && response.data) {
        // Fazer download do arquivo do certificado
        try {
          const conteudo = response.data.conteudo || ''
          const nomeArquivo = response.data.nome_arquivo || `certificado_${presencaId}.txt`
          const tipo = response.data.tipo || 'text/plain'
          
          // Criar um Blob com o conteúdo
          const blob = new Blob([conteudo], { type: tipo })
          
          // Criar um link temporário para download
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = nomeArquivo
          document.body.appendChild(link)
          link.click()
          
          // Limpar
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          setMessage({
            type: 'success',
            text: response.message || 'Certificado gerado e baixado com sucesso!',
          })
        } catch (downloadError) {
          console.error('Erro ao fazer download do certificado:', downloadError)
          setMessage({
            type: 'success',
            text: response.message || 'Certificado gerado com sucesso! (Erro ao fazer download)',
          })
        }
      } else {
        // Reverter o estado se a operação falhou
        setInscricoes((prevInscricoes) =>
          prevInscricoes.map((insc) =>
            insc.id === inscricaoId
              ? { ...insc, certificado_gerado: false }
              : insc
          )
        )
        setInscricoesFiltradas((prevInscricoes) =>
          prevInscricoes.map((insc) =>
            insc.id === inscricaoId
              ? { ...insc, certificado_gerado: false }
              : insc
          )
        )
        setMessage({
          type: 'error',
          text: response.message || 'Erro ao gerar certificado.',
        })
      }
    } catch (error) {
      // Reverter o estado se houver erro
      setInscricoes((prevInscricoes) =>
        prevInscricoes.map((insc) =>
          insc.id === inscricaoId
            ? { ...insc, certificado_gerado: false }
            : insc
        )
      )
      setInscricoesFiltradas((prevInscricoes) =>
        prevInscricoes.map((insc) =>
          insc.id === inscricaoId
            ? { ...insc, certificado_gerado: false }
            : insc
        )
      )
      setMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          'Erro ao gerar certificado. Tente novamente.',
      })
    } finally {
      setProcessando(null)
      setTimeout(() => setMessage({ type: '', text: '' }), 5000)
    }
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
                Minhas Inscrições
              </h1>
              <p className="text-sm text-gray-600">
                Olá, {userData.nome || 'Usuário'}!
              </p>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              ← Voltar para Home
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
              Filtrar por ID da Inscrição
            </label>
            <input
              id="filtro"
              type="text"
              value={filtroId}
              onChange={(e) => setFiltroId(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              placeholder="Digite o ID da inscrição..."
            />
          </div>
        </div>

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

        {/* Loading */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Carregando inscrições...</p>
          </div>
        ) : inscricoesFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-4 text-gray-600">
              {filtroId
                ? 'Nenhuma inscrição encontrada com este ID'
                : 'Você ainda não possui inscrições'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inscricoesFiltradas.map((inscricao) => (
              <div
                key={inscricao.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {inscricao.evento?.descricao || 'Evento'}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
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
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          ID: {inscricao.id}
                        </div>
                        <div className="flex items-center">
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
                          Inscrito em: {formatarData(inscricao.created_at)}
                        </div>
                        {inscricao.presenca_confirmada && (
                          <div className="flex items-center text-green-600 font-semibold">
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Presença Confirmada
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <button
                      onClick={() => handleRegistrarPresenca(inscricao.id)}
                      disabled={
                        processando === `presenca-${inscricao.id}` ||
                        inscricao.presenca_confirmada
                      }
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {processando === `presenca-${inscricao.id}`
                        ? 'Registrando...'
                        : inscricao.presenca_confirmada
                        ? 'Presença Já Registrada'
                        : 'Registrar Presença'}
                    </button>

                    <button
                      onClick={() => handleCancelarInscricao(inscricao.id)}
                      disabled={processando === `cancelar-${inscricao.id}`}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {processando === `cancelar-${inscricao.id}`
                        ? 'Cancelando...'
                        : 'Cancelar Inscrição'}
                    </button>

                    <button
                      onClick={() => handleGerarCertificado(inscricao.id)}
                      disabled={
                        processando === `certificado-${inscricao.id}` ||
                        !inscricao.presenca_confirmada ||
                        inscricao.certificado_gerado
                      }
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {processando === `certificado-${inscricao.id}`
                        ? 'Gerando...'
                        : inscricao.certificado_gerado
                        ? 'Certificado Já Gerado'
                        : 'Gerar Certificado'}
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

export default MinhasInscricoes

