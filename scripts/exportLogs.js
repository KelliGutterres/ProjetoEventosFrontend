/**
 * Script para exportar logs de auditoria do IndexedDB/localStorage para arquivos
 * 
 * Uso: node scripts/exportLogs.js [data]
 * 
 * Se uma data for fornecida (formato YYYY-MM-DD), exporta apenas os logs daquela data.
 * Caso contrário, exporta todos os logs disponíveis.
 * 
 * Os logs serão salvos na pasta logs/auditoria/
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Pasta de logs
const LOGS_DIR = path.join(__dirname, '..', 'logs', 'auditoria')

/**
 * Garante que a pasta de logs existe
 */
function ensureLogsDirectory() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true })
    console.log(`Pasta de logs criada: ${LOGS_DIR}`)
  }
}

/**
 * Lê logs do localStorage (simulado - em produção, isso viria do IndexedDB do navegador)
 * Para uso real, você precisaria exportar os logs do navegador primeiro
 */
function readLogsFromFile(inputFile) {
  try {
    if (fs.existsSync(inputFile)) {
      const content = fs.readFileSync(inputFile, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.error(`Erro ao ler arquivo ${inputFile}:`, error.message)
  }
  return []
}

/**
 * Agrupa logs por data
 */
function groupLogsByDate(logs) {
  const grouped = {}
  logs.forEach(log => {
    const date = log.date || new Date(log.timestamp).toISOString().split('T')[0]
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(log)
  })
  return grouped
}

/**
 * Salva logs em arquivo JSON
 */
function saveLogsToFile(date, logs) {
  const filename = path.join(LOGS_DIR, `audit-${date}.json`)
  const content = JSON.stringify(logs, null, 2)
  fs.writeFileSync(filename, content, 'utf-8')
  console.log(`✓ Logs salvos: ${filename} (${logs.length} registros)`)
}

/**
 * Função principal
 */
function main() {
  const args = process.argv.slice(2)
  const targetDate = args[0] // Data no formato YYYY-MM-DD (opcional)

  console.log('=== Exportador de Logs de Auditoria ===\n')

  // Garantir que a pasta existe
  ensureLogsDirectory()

  // Se uma data específica foi fornecida, processar apenas essa data
  if (targetDate) {
    console.log(`Exportando logs da data: ${targetDate}`)
    
    // Procurar arquivo de exportação do navegador
    const exportFile = path.join(LOGS_DIR, `export-${targetDate}.json`)
    
    if (fs.existsSync(exportFile)) {
      const logs = readLogsFromFile(exportFile)
      if (logs.length > 0) {
        saveLogsToFile(targetDate, logs)
      } else {
        console.log(`Nenhum log encontrado para a data ${targetDate}`)
      }
    } else {
      console.log(`Arquivo de exportação não encontrado: ${exportFile}`)
      console.log('Para exportar logs do navegador, use a função exportLogsByDate() no console do navegador')
    }
  } else {
    console.log('Exportando todos os logs disponíveis...')
    
    // Procurar todos os arquivos de exportação
    const exportFiles = fs.readdirSync(LOGS_DIR)
      .filter(file => file.startsWith('export-') && file.endsWith('.json'))
      .map(file => path.join(LOGS_DIR, file))

    if (exportFiles.length === 0) {
      console.log('Nenhum arquivo de exportação encontrado.')
      console.log('Para exportar logs do navegador:')
      console.log('1. Abra o console do navegador (F12)')
      console.log('2. Execute: await auditLogger.exportAllLogs()')
      console.log('3. Copie o resultado e salve em logs/auditoria/export-YYYY-MM-DD.json')
      return
    }

    // Processar cada arquivo de exportação
    const allLogs = []
    exportFiles.forEach(file => {
      const logs = readLogsFromFile(file)
      allLogs.push(...logs)
    })

    if (allLogs.length === 0) {
      console.log('Nenhum log encontrado nos arquivos de exportação.')
      return
    }

    // Agrupar por data e salvar
    const grouped = groupLogsByDate(allLogs)
    Object.keys(grouped).forEach(date => {
      saveLogsToFile(date, grouped[date])
    })

    console.log(`\n✓ Total de ${allLogs.length} logs processados`)
    console.log(`✓ ${Object.keys(grouped).length} arquivo(s) criado(s)`)
  }

  console.log('\n=== Exportação concluída ===')
}

// Executar
main()

