/**
 * Serviço de Logging de Auditoria
 * Registra requisições HTTP e rotas acessadas para fins de auditoria
 */

class AuditLogger {
  constructor() {
    this.logs = []
    this.maxLogsInMemory = 1000 // Limite de logs em memória antes de limpar os mais antigos
    this.initStorage()
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
   * Registra uma rota acessada
   */
  async logRoute(pathname, search = '') {
    const log = {
      id: this.generateId(),
      type: 'route',
      timestamp: this.formatTimestamp(),
      date: this.getDateString(),
      path: pathname,
      fullPath: search ? `${pathname}${search}` : pathname,
      query: search ? this.parseQueryString(search) : null,
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
}

// Exportar instância singleton
const auditLogger = new AuditLogger()
export default auditLogger

