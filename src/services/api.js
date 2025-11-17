import axios from 'axios'

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
    const response = await api.post('/api/usuarios', dados)
    return response.data
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
    const response = await api.post('http://177.44.248.78:8001/api/inscricoes', {
      evento_id: eventoId,
      usuario_id: userId,
    })
    return response.data
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
  cancelar: async (inscricaoId, userId) => {
    const response = await api.delete(`http://177.44.248.78:8000/api/eventos/${inscricaoId}`)
    return response.data
  },
  gerarCertificado: async (inscricaoId) => {
    const response = await api.post('http://177.44.248.78:8001/api/certificados', {
      inscricao_id: inscricaoId,
    })
    return response.data
  },
}

export const presencasAPI = {
  registrar: async (inscricaoId) => {
    // Chama a API real de presenças
    const response = await api.post('/api/presencas', {
      inscricao_id: inscricaoId,
    })
    return response.data
  },
}

export const emailAPI = {
  enviarPresenca: async (idUsuario, idEvento) => {
    // Chama a API de emails para enviar email de presença
    const response = await apiEmail.post('/api/email/presenca', {
      id_usuario: idUsuario,
      id_evento: idEvento,
    })
    return response.data
  },
  enviarInscricao: async (idUsuario, idEvento) => {
    // Chama a API de emails para enviar email de inscrição
    const response = await apiEmail.post('/api/email/inscricao', {
      id_usuario: idUsuario,
      id_evento: idEvento,
    })
    return response.data
  },
  enviarCancelamento: async (idUsuario, idEvento) => {
    // Chama a API de emails para enviar email de cancelamento
    const response = await apiEmail.post('/api/email/cancelar', {
      id_usuario: idUsuario,
      id_evento: idEvento,
    })
    return response.data
  },
}

export default api

