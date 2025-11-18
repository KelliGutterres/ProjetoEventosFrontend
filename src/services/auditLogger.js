/**
 * Serviço de Logging de Auditoria
 * Registra requisições HTTP e rotas acessadas para fins de auditoria
 */

class AuditLogger {
  constructor() {
    this.logs = []
    this.maxLogsInMemory = 1000 // Limite de logs em memória antes de limpar os mais antigos
    this.lastSavedDate = null // Última data em que os logs foram salvos
    this.autoSaveInterval = null // Intervalo para salvamento automático
    this.fileHandle = null // Handle do arquivo (File System Access API)
    this.initStorage()
    this.startAutoSave()
  }

  /**
   * Inicializa o armazenamento (IndexedDB para persistência)
   */
  async initStorage() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        // Verificar se já existe um banco de dados
        const dbName = 'AuditLogsDB'
        const dbVersion = 1
        
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(dbName, dbVersion)
          
          request.onerror = () => {
            console.warn('IndexedDB não disponível, usando localStorage como fallback')
            resolve()
          }
          
          request.onsuccess = () => {
            this.db = request.result
            resolve()
          }
          
          request.onupgradeneeded = (event) => {
            const db = event.target.result
            if (!db.objectStoreNames.contains('logs')) {
              const objectStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true })
              objectStore.createIndex('timestamp', 'timestamp', { unique: false })
              objectStore.createIndex('date', 'date', { unique: false })
              objectStore.createIndex('type', 'type', { unique: false })
            }
          }
        })
      } catch (error) {
        console.warn('Erro ao inicializar IndexedDB:', error)
      }
    }
  }

  /**
   * Gera um ID único para o log
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Formata a data atual para nome de arquivo
   */
  getDateString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Formata timestamp para exibição
   */
  formatTimestamp() {
    const now = new Date()
    return now.toISOString()
  }

  /**
   * Obtém informações do usuário atual
   */
  getUserInfo() {
    try {
      const userData = localStorage.getItem('userData')
      if (userData) {
        const user = JSON.parse(userData)
        return {
          id: user.id || null,
          nome: user.nome || null,
          email: user.email || null,
          admin: user.admin || false,
        }
      }
    } catch (error) {
      console.error('Erro ao obter informações do usuário:', error)
    }
    return {
      id: null,
      nome: null,
      email: null,
      admin: false,
    }
  }

  /**
   * Salva um log no IndexedDB
   */
  async saveLogToIndexedDB(log) {
    if (!this.db) return

    try {
      const transaction = this.db.transaction(['logs'], 'readwrite')
      const objectStore = transaction.objectStore('logs')
      await objectStore.add(log)
    } catch (error) {
      console.error('Erro ao salvar log no IndexedDB:', error)
    }
  }

  /**
   * Registra uma requisição HTTP
   */
  async logRequest(config) {
    const log = {
      id: this.generateId(),
      type: 'request',
      timestamp: this.formatTimestamp(),
      date: this.getDateString(),
      method: config.method?.toUpperCase() || 'UNKNOWN',
      url: config.url || config.baseURL || 'UNKNOWN',
      fullUrl: config.url ? `${config.baseURL || ''}${config.url}` : config.baseURL || 'UNKNOWN',
      headers: this.sanitizeHeaders(config.headers || {}),
      data: config.data ? this.sanitizeData(config.data) : null,
      params: config.params || null,
      user: this.getUserInfo(),
    }

    this.logs.push(log)
    
    // Limitar tamanho do array em memória
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift()
    }

    // Salvar no IndexedDB
    await this.saveLogToIndexedDB(log)

    return log
  }

  /**
   * Registra uma resposta HTTP
   */
  async logResponse(response) {
    const log = {
      id: this.generateId(),
      type: 'response',
      timestamp: this.formatTimestamp(),
      date: this.getDateString(),
      method: response.config?.method?.toUpperCase() || 'UNKNOWN',
      url: response.config?.url || 'UNKNOWN',
      fullUrl: response.config?.url 
        ? `${response.config.baseURL || ''}${response.config.url}` 
        : 'UNKNOWN',
      status: response.status || null,
      statusText: response.statusText || null,
      headers: this.sanitizeHeaders(response.headers || {}),
      data: response.data ? this.sanitizeData(response.data) : null,
      user: this.getUserInfo(),
    }

    this.logs.push(log)
    
    // Limitar tamanho do array em memória
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift()
    }

    // Salvar no IndexedDB
    await this.saveLogToIndexedDB(log)

    return log
  }

  /**
   * Registra um erro HTTP
   */
  async logError(error) {
    const log = {
      id: this.generateId(),
      type: 'error',
      timestamp: this.formatTimestamp(),
      date: this.getDateString(),
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
      url: error.config?.url || 'UNKNOWN',
      fullUrl: error.config?.url 
        ? `${error.config.baseURL || ''}${error.config.url}` 
        : 'UNKNOWN',
      status: error.response?.status || null,
      statusText: error.response?.statusText || null,
      message: error.message || 'Unknown error',
      responseData: error.response?.data ? this.sanitizeData(error.response.data) : null,
      user: this.getUserInfo(),
    }

    this.logs.push(log)
    
    // Limitar tamanho do array em memória
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift()
    }

    // Salvar no IndexedDB
    await this.saveLogToIndexedDB(log)

    return log
  }

  /**
   * Remove informações sensíveis dos headers
   */
  sanitizeHeaders(headers) {
    const sanitized = { ...headers }
    const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'token']
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]'
      }
      // Também verificar variações
      Object.keys(sanitized).forEach(headerKey => {
        if (headerKey.toLowerCase().includes(key.toLowerCase())) {
          sanitized[headerKey] = '[REDACTED]'
        }
      })
    })
    
    return sanitized
  }

  /**
   * Remove informações sensíveis dos dados
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data
    }

    const sensitiveFields = ['senha', 'password', 'token', 'authorization', 'secret']
    const sanitized = Array.isArray(data) ? [...data] : { ...data }

    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj
      
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item))
      }

      const result = {}
      for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase()
        if (sensitiveFields.some(field => keyLower.includes(field))) {
          result[key] = '[REDACTED]'
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value)
        } else {
          result[key] = value
        }
      }
      return result
    }

    return sanitizeObject(sanitized)
  }

  /**
   * Parse query string para objeto
   */
  parseQueryString(search) {
    if (!search || !search.startsWith('?')) return null
    
    const params = new URLSearchParams(search.substring(1))
    const result = {}
    for (const [key, value] of params.entries()) {
      result[key] = value
    }
    return result
  }

  /**
   * Obtém logs do IndexedDB por data
   */
  async getLogsByDate(date) {
    if (!this.db) {
      return this.logs.filter(log => log.date === date)
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['logs'], 'readonly')
      const objectStore = transaction.objectStore('logs')
      const index = objectStore.index('date')
      const request = index.getAll(date)

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * Obtém todos os logs de uma data específica
   */
  async getAllLogsByDate(date) {
    try {
      const indexedLogs = await this.getLogsByDate(date)
      const memoryLogs = this.logs.filter(log => log.date === date)
      
      // Combinar e remover duplicatas
      const allLogs = [...indexedLogs, ...memoryLogs]
      const uniqueLogs = []
      const seenIds = new Set()
      
      allLogs.forEach(log => {
        if (!seenIds.has(log.id)) {
          seenIds.add(log.id)
          uniqueLogs.push(log)
        }
      })
      
      return uniqueLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    } catch (error) {
      console.error('Erro ao obter logs por data:', error)
      return this.logs.filter(log => log.date === date)
    }
  }

  /**
   * Exporta logs de uma data específica como JSON
   */
  async exportLogsByDate(date) {
    const logs = await this.getAllLogsByDate(date)
    return JSON.stringify(logs, null, 2)
  }

  /**
   * Exporta todos os logs como JSON
   */
  async exportAllLogs() {
    if (!this.db) {
      return JSON.stringify(this.logs, null, 2)
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['logs'], 'readonly')
      const objectStore = transaction.objectStore('logs')
      const request = objectStore.getAll()

      request.onsuccess = () => {
        const allLogs = [...(request.result || []), ...this.logs]
        // Remover duplicatas
        const uniqueLogs = []
        const seenIds = new Set()
        
        allLogs.forEach(log => {
          if (!seenIds.has(log.id)) {
            seenIds.add(log.id)
            uniqueLogs.push(log)
          }
        })
        
        resolve(JSON.stringify(uniqueLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)), null, 2))
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * Limpa logs antigos (mais de X dias)
   */
  async clearOldLogs(daysToKeep = 30) {
    if (!this.db) return

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    const cutoffDateString = this.formatDate(cutoffDate)

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['logs'], 'readwrite')
      const objectStore = transaction.objectStore('logs')
      const index = objectStore.index('date')
      const request = index.openCursor()

      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          if (cursor.value.date < cutoffDateString) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * Formata data para string YYYY-MM-DD
   */
  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Inicia o salvamento automático de logs
   * Salva os logs a cada 30 minutos ou quando a data muda
   */
  startAutoSave() {
    // Não salvar imediatamente ao iniciar para evitar downloads desnecessários
    // Salvar apenas quando houver atividade

    // Configurar salvamento periódico (a cada 30 minutos)
    this.autoSaveInterval = setInterval(() => {
      this.saveLogsToFile().catch(err => {
        console.warn('Erro ao salvar logs automaticamente:', err)
      })
    }, 30 * 60 * 1000) // 30 minutos

    // Salvar quando a página for fechada
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveLogsToFile().catch(() => {
          // Ignorar erros ao fechar
        })
      })
    }
  }

  /**
   * Para o salvamento automático
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  /**
   * Salva logs do dia atual em arquivo
   * Usa download automático se File System Access API não estiver disponível
   */
  async saveLogsToFile() {
    const today = this.getDateString()
    
    // Se já salvou hoje, verificar se há novos logs
    if (this.lastSavedDate === today) {
      // Verificar se há novos logs desde o último salvamento
      const recentLogs = this.logs.filter(log => log.date === today)
      if (recentLogs.length === 0) {
        return // Nenhum log novo
      }
    }

    try {
      const logs = await this.getAllLogsByDate(today)
      
      if (logs.length === 0) {
        return // Nenhum log para salvar
      }

      // Tentar usar File System Access API (Chrome/Edge)
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        await this.saveWithFileSystemAPI(today, logs)
      } else {
        // Fallback: download automático
        await this.downloadLogsFile(today, logs)
      }

      this.lastSavedDate = today
    } catch (error) {
      console.error('Erro ao salvar logs em arquivo:', error)
      // Tentar download como fallback
      try {
        const logs = await this.getAllLogsByDate(today)
        await this.downloadLogsFile(today, logs)
      } catch (downloadError) {
        console.error('Erro ao fazer download dos logs:', downloadError)
      }
    }
  }

  /**
   * Salva logs usando File System Access API (Chrome/Edge)
   */
  async saveWithFileSystemAPI(date, logs) {
    try {
      // Se já temos um handle de arquivo para hoje, usar ele
      if (this.fileHandle && this.lastSavedDate === date) {
        const writable = await this.fileHandle.createWritable()
        const content = JSON.stringify(logs, null, 2)
        await writable.write(content)
        await writable.close()
        return
      }

      // Solicitar permissão para salvar arquivo
      const options = {
        suggestedName: `audit-${date}.json`,
        types: [{
          description: 'JSON files',
          accept: { 'application/json': ['.json'] }
        }]
      }

      // Tentar abrir arquivo existente primeiro
      try {
        this.fileHandle = await window.showSaveFilePicker(options)
        const writable = await this.fileHandle.createWritable()
        const content = JSON.stringify(logs, null, 2)
        await writable.write(content)
        await writable.close()
      } catch (error) {
        // Usuário cancelou ou erro - usar download como fallback
        await this.downloadLogsFile(date, logs)
      }
    } catch (error) {
      // File System Access API não disponível ou erro - usar download
      await this.downloadLogsFile(date, logs)
    }
  }

  /**
   * Faz download automático dos logs (fallback)
   */
  async downloadLogsFile(date, logs) {
    try {
      const content = JSON.stringify(logs, null, 2)
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-${date}.json`
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      
      // Limpar após um tempo
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error('Erro ao fazer download dos logs:', error)
      throw error
    }
  }

  /**
   * Salva logs manualmente (para uso via console)
   */
  async saveLogsManually(date = null) {
    const targetDate = date || this.getDateString()
    const logs = await this.getAllLogsByDate(targetDate)
    
    if (logs.length === 0) {
      console.log(`Nenhum log encontrado para a data ${targetDate}`)
      return
    }

    // Tentar usar File System Access API
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      await this.saveWithFileSystemAPI(targetDate, logs)
    } else {
      await this.downloadLogsFile(targetDate, logs)
    }

    console.log(`✓ ${logs.length} logs salvos para a data ${targetDate}`)
  }
}

// Exportar instância singleton
const auditLogger = new AuditLogger()
export default auditLogger

