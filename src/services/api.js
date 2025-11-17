import axios from 'axios'
import { 
  isOnline, 
  addUsuarioToQueue, 
  addInscricaoToQueue, 
  addPresencaToQueue 
} from './offlineService'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_EMAIL_URL = import.meta.env.VITE_API_EMAIL_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Instância separada para a API de emails
const apiEmail = axios.create({
  baseURL: API_EMAIL_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token se existir
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para adicionar token nas requisições de email
apiEmail.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const usuariosAPI = {
  criar: async (dados) => {
    // Se estiver offline, salvar na fila
    if (!isOnline()) {
      console.log('Modo offline: salvando cadastro de usuário na fila')
      const usuarioOffline = addUsuarioToQueue(dados)
      return {
        success: true,
        message: 'Usuário cadastrado offline. Será sincronizado quando voltar online.',
        data: { id: usuarioOffline.id_local },
        offline: true,
      }
    }

    // Se estiver online, fazer requisição normal
    try {
      const response = await api.post('/api/usuarios', dados)
      return response.data
    } catch (error) {
      // Se a requisição falhar e for erro de rede, tentar salvar offline
      if (!error.response && !isOnline()) {
        console.log('Erro de rede: salvando cadastro de usuário na fila')
        const usuarioOffline = addUsuarioToQueue(dados)
        return {
          success: true,
          message: 'Usuário cadastrado offline. Será sincronizado quando voltar online.',
          data: { id: usuarioOffline.id_local },
          offline: true,
        }
      }
      throw error
    }
  },
}

export const authAPI = {
  login: async (email, senha) => {
    const response = await api.post('/api/auth', { email, senha })
    return response.data
  },
}

export const eventosAPI = {
  listar: async () => {
    const response = await api.get('http://177.44.248.78:8000/api/eventos')
    return response.data
  },
  buscarPorId: async (id) => {
    const response = await api.get(`http://177.44.248.78:8000/api/eventos/${id}`)
    return response.data
  },
  inscrever: async (eventoId, userId) => {
    // Se estiver offline, salvar na fila
    if (!isOnline()) {
      console.log('Modo offline: salvando inscrição na fila')
      const inscricaoOffline = addInscricaoToQueue({
        evento_id: eventoId,
        usuario_id: userId,
      })
      return {
        success: true,
        message: 'Inscrição realizada offline. Será sincronizada quando voltar online.',
        data: { id: inscricaoOffline.id_local },
        offline: true,
      }
    }

    // Se estiver online, fazer requisição normal
    try {
      const response = await api.post('http://177.44.248.78:8001/api/inscricoes', {
        evento_id: eventoId,
        usuario_id: userId,
      })
      return response.data
    } catch (error) {
      // Se a requisição falhar e for erro de rede, tentar salvar offline
      if (!error.response && !isOnline()) {
        console.log('Erro de rede: salvando inscrição na fila')
        const inscricaoOffline = addInscricaoToQueue({
          evento_id: eventoId,
          usuario_id: userId,
        })
        return {
          success: true,
          message: 'Inscrição realizada offline. Será sincronizada quando voltar online.',
          data: { id: inscricaoOffline.id_local },
          offline: true,
        }
      }
      throw error
    }
  },
}

export const certificadoAPI = {
  validar: async (codigo) => {
    const response = await api.post('http://177.44.248.78:8001/api/certificados/validacao', {
      codigo,
    })
    return response.data
  },
}

export const inscricoesAPI = {
  listar: async (userId) => {
    const response = await api.get(`http://177.44.248.78:8001/api/inscricoes/usuario/${userId}`)
    return response.data
  },
  cancelar: async (inscricaoId) => {
    const response = await api.delete(`http://177.44.248.78:8001/api/inscricoes/${inscricaoId}`, {
      data: {
        id: inscricaoId,
      }
    })
    return response.data
  },
  gerarCertificado: async (presenca_id) => {
    const response = await api.post('http://177.44.248.78:8001/api/certificados', {
      presenca_id: presenca_id,
    })
    return response.data
  },
}

export const presencasAPI = {
  registrar: async (inscricaoId) => {
    // Se estiver offline, salvar na fila
    if (!isOnline()) {
      console.log('Modo offline: salvando presença na fila')
      const presencaOffline = addPresencaToQueue({
        inscricao_id: inscricaoId,
      })
      return {
        success: true,
        message: 'Presença registrada offline. Será sincronizada quando voltar online.',
        data: { id: presencaOffline.id_local },
        offline: true,
      }
    }

    // Se estiver online, fazer requisição normal
    try {
      const response = await api.post('/api/presencas', {
        inscricao_id: inscricaoId,
      })
      return response.data
    } catch (error) {
      // Se a requisição falhar e for erro de rede, tentar salvar offline
      if (!error.response && !isOnline()) {
        console.log('Erro de rede: salvando presença na fila')
        const presencaOffline = addPresencaToQueue({
          inscricao_id: inscricaoId,
        })
        return {
          success: true,
          message: 'Presença registrada offline. Será sincronizada quando voltar online.',
          data: { id: presencaOffline.id_local },
          offline: true,
        }
      }
      throw error
    }
  },
}

export const emailAPI = {
  enviarPresenca: async (idUsuario, idEvento) => {
    // Chama a API de emails para enviar email de presença
    const response = await apiEmail.post('/api/email/presenca', {
      id_usuario: parseInt(idUsuario),
      id_evento: parseInt(idEvento),
    })
    return response.data
  },
  enviarInscricao: async (idUsuario, idEvento) => {
    // Chama a API de emails para enviar email de inscrição
    const response = await apiEmail.post('/api/email/inscricao', {
      id_usuario: parseInt(idUsuario),
      id_evento: parseInt(idEvento),
    })
    return response.data
  },
  enviarCancelamento: async (idUsuario, idEvento) => {
    // Chama a API de emails para enviar email de cancelamento
    const response = await apiEmail.post('/api/email/cancelar', {
      id_usuario: parseInt(idUsuario),
      id_evento: parseInt(idEvento),
    })
    return response.data
  },
}

export default api