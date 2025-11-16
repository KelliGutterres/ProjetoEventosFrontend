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
    // Mock da API - substitua pela sua API real quando criar
    return {
      success: true,
      data: [
        {
          id: 1,
          descricao: 'Workshop de React',
          data_inicio: '2024-02-01T10:00:00',
          data_final: '2024-02-01T18:00:00',
          cancelado: 0,
        },
        {
          id: 2,
          descricao: 'Conferência de Tecnologia',
          data_inicio: '2024-02-15T09:00:00',
          data_final: '2024-02-15T17:00:00',
          cancelado: 0,
        },
        {
          id: 3,
          descricao: 'Meetup de Desenvolvimento',
          data_inicio: '2024-03-01T19:00:00',
          data_final: '2024-03-01T21:00:00',
          cancelado: 0,
        },
      ],
    }
  },
  buscarPorId: async (id) => {
    // Mock da API - substitua pela sua API real quando criar
    return {
      success: true,
      data: {
        id: parseInt(id),
        descricao: 'Evento Encontrado',
        data_inicio: '2024-02-01T10:00:00',
        data_final: '2024-02-01T18:00:00',
        cancelado: 0,
      },
    }
  },
  inscrever: async (eventoId, userId) => {
    // Mock da API - substitua pela sua API real quando criar
    // A API real deve receber eventoId e userId no body
    console.log('Inscrição:', { eventoId, userId })
    return {
      success: true,
      message: 'Inscrição realizada com sucesso!',
    }
  },
}

export const certificadoAPI = {
  validar: async (codigo) => {
    // Mock da API - substitua pela sua API real quando criar
    return {
      success: true,
      message: 'Certificado válido!',
      data: {
        codigo,
        validado: true,
      },
    }
  },
}

export const inscricoesAPI = {
  listar: async (userId) => {
    // Mock da API - substitua pela sua API real quando criar
    // A API real deve receber userId como parâmetro e retornar as inscrições do usuário
    console.log('Listando inscrições para usuário:', userId)
    
    // Se for o usuário 9, retornar inscrições específicas para teste
    if (userId === 9) {
      return {
        success: true,
        data: [
          {
            id: 3,
            evento_id: 1,
            usuario_id: 9,
            evento: {
              id: 1,
              descricao: 'Workshop de React',
              data_inicio: '2024-02-01T10:00:00',
              data_final: '2024-02-01T18:00:00',
            },
            presenca_confirmada: false,
            created_at: '2024-01-25T10:30:00',
          },
          {
            id: 4,
            evento_id: 2,
            usuario_id: 9,
            evento: {
              id: 2,
              descricao: 'Conferência de Tecnologia',
              data_inicio: '2024-02-15T09:00:00',
              data_final: '2024-02-15T17:00:00',
            },
            presenca_confirmada: false,
            created_at: '2024-01-26T14:20:00',
          },
        ],
      }
    }
    
    // Para outros usuários, retornar dados padrão
    return {
      success: true,
      data: [
        {
          id: 1,
          evento_id: 1,
          usuario_id: userId,
          evento: {
            id: 1,
            descricao: 'Workshop de React',
            data_inicio: '2024-02-01T10:00:00',
            data_final: '2024-02-01T18:00:00',
          },
          presenca_confirmada: false,
          created_at: '2024-01-15T10:30:00',
        },
        {
          id: 2,
          evento_id: 2,
          usuario_id: userId,
          evento: {
            id: 2,
            descricao: 'Conferência de Tecnologia',
            data_inicio: '2024-02-15T09:00:00',
            data_final: '2024-02-15T17:00:00',
          },
          presenca_confirmada: true,
          created_at: '2024-01-20T14:20:00',
        },
      ],
    }
  },
  cancelar: async (inscricaoId, userId) => {
    // Mock da API - substitua pela sua API real quando criar
    // A API real deve receber inscricaoId e userId no body
    console.log('Cancelando inscrição:', { inscricaoId, userId })
    return {
      success: true,
      message: 'Inscrição cancelada com sucesso!',
    }
  },
  gerarCertificado: async (inscricaoId) => {
    // Mock da API - substitua pela sua API real quando criar
    // A API real deve receber inscricaoId e retornar o certificado ou código
    console.log('Gerando certificado para inscrição:', inscricaoId)
    return {
      success: true,
      message: 'Certificado gerado com sucesso!',
      data: {
        codigo: `CERT-${inscricaoId}-${Date.now()}`,
      },
    }
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

