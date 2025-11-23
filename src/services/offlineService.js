// Serviço para gerenciar operações offline

const STORAGE_KEY = 'offline_queue'
const SYNC_STATUS_KEY = 'sync_status'

// Gerar ID único local
const generateLocalId = () => {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Verificar se está online
export const isOnline = () => {
  return navigator.onLine
}

// Obter fila de operações pendentes
export const getOfflineQueue = () => {
  try {
    const queue = localStorage.getItem(STORAGE_KEY)
    if (queue) {
      const parsedQueue = JSON.parse(queue)
      // Garantir que todos os campos existam (para compatibilidade com versões antigas)
      return {
        usuarios: parsedQueue.usuarios || [],
        inscricoes: parsedQueue.inscricoes || [],
        presencas: parsedQueue.presencas || [],
        emails: parsedQueue.emails || [],
      }
    }
    return {
      usuarios: [],
      inscricoes: [],
      presencas: [],
      emails: [],
    }
  } catch (error) {
    console.error('Erro ao ler fila offline:', error)
    return {
      usuarios: [],
      inscricoes: [],
      presencas: [],
      emails: [],
    }
  }
}

// Salvar fila de operações
const saveOfflineQueue = (queue) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('Erro ao salvar fila offline:', error)
  }
}

// Adicionar usuário à fila
export const addUsuarioToQueue = (dados) => {
  const queue = getOfflineQueue()
  const usuario = {
    id_local: generateLocalId(),
    dados: dados,
    status: 'pendente',
    timestamp: new Date().toISOString(),
  }
  queue.usuarios.push(usuario)
  saveOfflineQueue(queue)
  return usuario
}

// Adicionar inscrição à fila
export const addInscricaoToQueue = (dados) => {
  const queue = getOfflineQueue()
  const inscricao = {
    id_local: generateLocalId(),
    dados: dados,
    status: 'pendente',
    timestamp: new Date().toISOString(),
  }
  queue.inscricoes.push(inscricao)
  saveOfflineQueue(queue)
  return inscricao
}

// Adicionar presença à fila
export const addPresencaToQueue = (dados) => {
  const queue = getOfflineQueue()
  const presenca = {
    id_local: generateLocalId(),
    dados: dados,
    status: 'pendente',
    timestamp: new Date().toISOString(),
  }
  queue.presencas.push(presenca)
  saveOfflineQueue(queue)
  return presenca
}

// Adicionar email à fila
export const addEmailToQueue = (tipo, dados) => {
  const queue = getOfflineQueue()
  const email = {
    id_local: generateLocalId(),
    tipo: tipo, // 'presenca', 'inscricao', 'cancelamento'
    dados: dados,
    status: 'pendente',
    timestamp: new Date().toISOString(),
  }
  queue.emails.push(email)
  saveOfflineQueue(queue)
  return email
}

// Remover item da fila após sincronização
const removeFromQueue = (tipo, idLocal) => {
  const queue = getOfflineQueue()
  queue[tipo] = queue[tipo].filter(item => item.id_local !== idLocal)
  saveOfflineQueue(queue)
}

// Obter status de sincronização
export const getSyncStatus = () => {
  try {
    const status = localStorage.getItem(SYNC_STATUS_KEY)
    return status ? JSON.parse(status) : {
      sincronizando: false,
      ultima_sincronizacao: null,
      total_pendente: 0,
    }
  } catch (error) {
    return {
      sincronizando: false,
      ultima_sincronizacao: null,
      total_pendente: 0,
    }
  }
}

// Atualizar status de sincronização
const updateSyncStatus = (status) => {
  try {
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status))
  } catch (error) {
    console.error('Erro ao atualizar status de sincronização:', error)
  }
}

// Contar itens pendentes
export const getPendingCount = () => {
  const queue = getOfflineQueue()
  return (queue.usuarios?.length || 0) + 
         (queue.inscricoes?.length || 0) + 
         (queue.presencas?.length || 0) + 
         (queue.emails?.length || 0)
}

// Obter inscrições offline do usuário atual
export const getOfflineInscricoes = (userId) => {
  const queue = getOfflineQueue()
  // Retornar inscrições offline que pertencem ao usuário
  // Nota: isso assume que o userId pode ser um ID local ou do servidor
  return queue.inscricoes
    .filter(insc => {
      // Verificar se a inscrição pertence ao usuário
      const inscUserId = insc.dados?.usuario_id
      return inscUserId === userId || insc.id_local === userId
    })
    .map(insc => ({
      id: insc.id_local,
      evento_id: insc.dados?.evento_id,
      usuario_id: insc.dados?.usuario_id,
      presenca_confirmada: false,
      created_at: insc.timestamp,
      offline: true,
    }))
}

// Sincronizar dados com a API
export const syncOfflineData = async (apis) => {
  if (!isOnline()) {
    console.log('Ainda offline, não é possível sincronizar')
    return { success: false, message: 'Ainda offline' }
  }

  const queue = getOfflineQueue()
  const status = getSyncStatus()

  if (status.sincronizando) {
    console.log('Sincronização já em andamento')
    return { success: false, message: 'Sincronização em andamento' }
  }

  updateSyncStatus({ ...status, sincronizando: true })

  try {
    let usuariosSincronizados = 0
    let inscricoesSincronizadas = 0
    let presencasSincronizadas = 0
    let emailsEnviados = 0
    let erros = []

    // 1. Sincronizar usuários primeiro
    for (const usuario of queue.usuarios || []) {
      if (usuario.status === 'pendente') {
        try {
          const response = await apis.usuariosAPI.criar(usuario.dados)
          if (response.success) {
            // Mapear ID local para ID do servidor para atualizar referências
            usuario.id_servidor = response.data?.id || response.data?.data?.id
            usuario.status = 'sincronizado'
            usuariosSincronizados++
          }
        } catch (error) {
          console.error('Erro ao sincronizar usuário:', error)
          erros.push({ tipo: 'usuario', id: usuario.id_local, erro: error.message })
        }
      }
    }
    
    // Atualizar fila após sincronizar usuários
    saveOfflineQueue(queue)

    // 2. Sincronizar inscrições (dependem de usuários)
    // Criar mapa de IDs locais para IDs do servidor
    const idMap = {}
    queue.usuarios.forEach(u => {
      if (u.id_servidor) {
        idMap[u.id_local] = u.id_servidor
      }
    })

    for (const inscricao of queue.inscricoes || []) {
      if (inscricao.status === 'pendente') {
        try {
          // Se o usuario_id é um ID local, tentar mapear para ID do servidor
          let usuarioId = inscricao.dados.usuario_id
          
          // Verificar se é um ID local (começa com "local_")
          if (usuarioId && usuarioId.toString().startsWith('local_')) {
            // É um ID local, tentar mapear
            if (idMap[usuarioId]) {
              usuarioId = idMap[usuarioId]
            } else {
              // Se não encontrou no mapa, pode ser que o usuário ainda não foi sincronizado
              const usuarioLocal = queue.usuarios.find(u => u.id_local === usuarioId)
              if (usuarioLocal && usuarioLocal.id_servidor) {
                usuarioId = usuarioLocal.id_servidor
                idMap[usuarioId] = usuarioLocal.id_servidor
              } else {
                // Usuário ainda não sincronizado, pular esta inscrição por enquanto
                console.warn(`Usuário ${usuarioId} ainda não sincronizado, pulando inscrição`)
                continue
              }
            }
          }
          // Se não é um ID local, usar diretamente (já é um ID do servidor)

          const response = await apis.eventosAPI.inscrever(
            inscricao.dados.evento_id,
            usuarioId
          )
          if (response.success) {
            inscricao.id_servidor = response.data?.id || response.data?.data?.id
            inscricao.status = 'sincronizado'
            inscricoesSincronizadas++
          }
        } catch (error) {
          console.error('Erro ao sincronizar inscrição:', error)
          erros.push({ tipo: 'inscricao', id: inscricao.id_local, erro: error.message })
        }
      }
    }

    // 3. Sincronizar presenças (dependem de inscrições)
    // Atualizar fila após sincronizar inscrições
    saveOfflineQueue(queue)
    
    // Atualizar mapa com IDs de inscrições
    queue.inscricoes.forEach(i => {
      if (i.id_servidor) {
        idMap[i.id_local] = i.id_servidor
      }
    })

    for (const presenca of queue.presencas || []) {
      if (presenca.status === 'pendente') {
        try {
          // Se o inscricao_id é um ID local, tentar mapear para ID do servidor
          let inscricaoId = presenca.dados.inscricao_id
          
          // Verificar se é um ID local (começa com "local_")
          if (inscricaoId && inscricaoId.toString().startsWith('local_')) {
            // É um ID local, tentar mapear
            if (idMap[inscricaoId]) {
              inscricaoId = idMap[inscricaoId]
            } else {
              // Se não encontrou no mapa, pode ser que a inscrição ainda não foi sincronizada
              const inscricaoLocal = queue.inscricoes.find(i => i.id_local === inscricaoId)
              if (inscricaoLocal && inscricaoLocal.id_servidor) {
                inscricaoId = inscricaoLocal.id_servidor
                idMap[inscricaoId] = inscricaoLocal.id_servidor
              } else {
                // Inscrição ainda não sincronizada, pular esta presença por enquanto
                console.warn(`Inscrição ${inscricaoId} ainda não sincronizada, pulando presença`)
                continue
              }
            }
          }
          // Se não é um ID local, usar diretamente (já é um ID do servidor)

          const response = await apis.presencasAPI.registrar(inscricaoId)
          if (response.success) {
            presenca.id_servidor = response.data?.id || response.data?.data?.id
            presenca.status = 'sincronizado'
            presencasSincronizadas++
          }
        } catch (error) {
          console.error('Erro ao sincronizar presença:', error)
          erros.push({ tipo: 'presenca', id: presenca.id_local, erro: error.message })
        }
      }
    }

    // 4. Enviar emails pendentes (após sincronizar tudo)
    // Atualizar fila após sincronizar presenças
    saveOfflineQueue(queue)
    
    // Atualizar mapa com IDs de presenças (se necessário)
    if (queue.presencas) {
      queue.presencas.forEach(p => {
        if (p.id_servidor) {
          idMap[p.id_local] = p.id_servidor
        }
      })
    }

    // Garantir que emails existe
    if (!queue.emails) {
      queue.emails = []
    }

    for (const email of queue.emails) {
      if (email.status === 'pendente') {
        try {
          let userId = email.dados.id_usuario
          let eventoId = email.dados.id_evento
          
          // Se o userId é um ID local, tentar mapear para ID do servidor
          if (userId && userId.toString().startsWith('local_')) {
            if (idMap[userId]) {
              userId = idMap[userId]
            } else {
              // Usuário ainda não sincronizado, pular este email por enquanto
              console.warn(`Usuário ${userId} ainda não sincronizado, pulando email`)
              continue
            }
          }

          // Enviar email baseado no tipo
          let response
          if (email.tipo === 'presenca') {
            response = await apis.emailAPI.enviarPresenca(userId, eventoId)
          } else if (email.tipo === 'inscricao') {
            response = await apis.emailAPI.enviarInscricao(userId, eventoId)
          } else if (email.tipo === 'cancelamento') {
            response = await apis.emailAPI.enviarCancelamento(userId, eventoId)
          }

          if (response && response.success) {
            email.status = 'sincronizado'
            emailsEnviados++
          }
        } catch (error) {
          console.error('Erro ao enviar email:', error)
          erros.push({ tipo: 'email', id: email.id_local, erro: error.message })
        }
      }
    }

    // Remover itens sincronizados da fila
    queue.usuarios = (queue.usuarios || []).filter(u => u.status !== 'sincronizado')
    queue.inscricoes = (queue.inscricoes || []).filter(i => i.status !== 'sincronizado')
    queue.presencas = (queue.presencas || []).filter(p => p.status !== 'sincronizado')
    queue.emails = (queue.emails || []).filter(e => e.status !== 'sincronizado')
    saveOfflineQueue(queue)

    updateSyncStatus({
      sincronizando: false,
      ultima_sincronizacao: new Date().toISOString(),
      total_pendente: getPendingCount(),
    })

    return {
      success: true,
      usuarios: usuariosSincronizados,
      inscricoes: inscricoesSincronizadas,
      presencas: presencasSincronizadas,
      emails: emailsEnviados,
      erros: erros.length > 0 ? erros : null,
    }
  } catch (error) {
    updateSyncStatus({ ...status, sincronizando: false })
    console.error('Erro na sincronização:', error)
    return { success: false, message: error.message }
  }
}

// Limpar fila (útil para testes)
export const clearOfflineQueue = () => {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(SYNC_STATUS_KEY)
}

