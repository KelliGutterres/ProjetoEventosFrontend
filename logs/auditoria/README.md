# Logs de Auditoria

Esta pasta contém os logs de auditoria do sistema, organizados por data.

## Estrutura

- `audit-YYYY-MM-DD.json`: Logs do dia específico
- Cada arquivo contém todos os registros de requisições HTTP e rotas acessadas naquele dia

## Formato dos Logs

Os logs são salvos em formato JSON e contêm:
- Requisições HTTP (request/response)
- Erros HTTP
- Rotas acessadas
- Informações do usuário (quando disponível)
- Timestamps completos

## Privacidade

⚠️ **IMPORTANTE**: Os logs são sanitizados automaticamente para remover informações sensíveis como:
- Tokens de autenticação
- Senhas
- Cookies
- Outros dados sensíveis

Esses campos aparecem como `[REDACTED]` nos logs.

## Manutenção

- Os logs são organizados automaticamente por data
- Recomenda-se fazer backup periódico desta pasta
- Logs antigos podem ser removidos após período de retenção definido pela política de auditoria

