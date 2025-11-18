# Scripts de Auditoria

## Exportar Logs

O script `exportLogs.js` permite exportar logs de auditoria do navegador para arquivos JSON na pasta `logs/auditoria/`.

### Como usar:

1. **Exportar logs do navegador:**
   - Abra o console do navegador (F12)
   - Execute o seguinte comando para exportar logs de uma data específica:
     ```javascript
     // Exportar logs de uma data específica
     const logs = await auditLogger.exportLogsByDate('2024-01-15')
     console.log(logs)
     // Copie o resultado e salve em logs/auditoria/export-2024-01-15.json
     ```
   
   - Ou exporte todos os logs:
     ```javascript
     // Exportar todos os logs
     const allLogs = await auditLogger.exportAllLogs()
     console.log(allLogs)
     // Copie o resultado e salve em logs/auditoria/export-all.json
     ```

2. **Processar logs exportados:**
   ```bash
   # Exportar logs de uma data específica
   node scripts/exportLogs.js 2024-01-15
   
   # Exportar todos os logs disponíveis
   node scripts/exportLogs.js
   ```

3. **Resultado:**
   - Os logs serão salvos em `logs/auditoria/audit-YYYY-MM-DD.json`
   - Cada arquivo contém todos os logs daquele dia

### Estrutura dos logs:

Cada log contém:
- `id`: ID único do log
- `type`: Tipo do log (`request`, `response`, `error`, `route`)
- `timestamp`: Data e hora ISO
- `date`: Data no formato YYYY-MM-DD
- `method`: Método HTTP (para requisições)
- `url`: URL da requisição
- `status`: Status HTTP (para respostas)
- `user`: Informações do usuário (id, nome, email, admin)
- Outros campos específicos do tipo de log

### Limpeza de logs antigos:

Para limpar logs antigos (mais de 30 dias), execute no console do navegador:
```javascript
await auditLogger.clearOldLogs(30)
```

