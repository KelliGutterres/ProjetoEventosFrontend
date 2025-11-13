# Projeto Eventos - Frontend

Frontend desenvolvido em React para o sistema de gerenciamento de eventos.

## 🚀 Tecnologias

- **React 18** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool moderna e rápida
- **React Router** - Roteamento de páginas
- **Axios** - Cliente HTTP para consumo de APIs
- **Tailwind CSS** - Framework CSS utilitário para design moderno

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

## 🛠️ Instalação

1. **Instale as dependências:**
```bash
cd frontend
npm install
```

2. **Configure a URL da API** (opcional):
   - Crie um arquivo `.env` na pasta `frontend`:
   ```
   VITE_API_URL=http://localhost:3000
   ```

## 🏃 Como executar

```bash
npm run dev
```

O servidor de desenvolvimento estará rodando em `http://localhost:5173`

## 📱 Telas Disponíveis

### 1. **Login** (`/login`)
- Campos: E-mail e Senha
- Botão: Entrar
- Link: Cadastre-se

### 2. **Cadastro** (`/cadastro`)
- Campos: Nome, E-mail, Senha, Confirmar Senha
- Botão: Criar Conta
- Link: Fazer login

### 3. **Home** (`/home`)
- Listagem de eventos disponíveis
- Filtro por ID do evento
- Botão "Inscrever-se" em cada evento
- Navegação para validar certificado
- Botão de logout

### 4. **Validar Certificado** (`/validar-certificado`)
- Campo: Código do certificado
- Botão: Validar Certificado
- Exibição do resultado da validação

## 🔌 Integração com APIs

### APIs Conectadas:
- ✅ `POST /api/usuarios` - Cadastro de usuário
- ✅ `POST /api/auth` - Autenticação/login

### APIs Mockadas (aguardando implementação):
- ⏳ `GET /api/eventos` - Listar eventos
- ⏳ `GET /api/eventos/:id` - Buscar evento por ID
- ⏳ `POST /api/inscricoes` - Inscrever em evento
- ⏳ `POST /api/certificados/validar` - Validar certificado

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Cadastro.jsx
│   │   ├── Home.jsx
│   │   └── ValidarCertificado.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

## 🎨 Design

O projeto utiliza:
- Design moderno com gradientes suaves
- Componentes responsivos
- Animações e transições suaves
- Feedback visual para ações do usuário
- Ícones SVG para melhor UX

## 📝 Notas Importantes

1. **Autenticação**: O sistema salva os dados do usuário no `localStorage` após login bem-sucedido.

2. **APIs Mockadas**: Algumas funcionalidades estão usando dados mockados. Quando as APIs reais forem implementadas, basta atualizar as funções em `src/services/api.js`.

3. **Campos Adicionais**: A API de cadastro requer CPF e data de nascimento. Por enquanto, estes campos estão sendo enviados com valores padrão. Ajuste conforme necessário.

4. **Proteção de Rotas**: As rotas protegidas (`/home` e `/validar-certificado`) redirecionam para `/login` se o usuário não estiver autenticado.

## 🔧 Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist`.

## 📚 Documentação das APIs

Consulte a documentação Swagger em `http://localhost:3000/api-docs` para detalhes completos das APIs disponíveis.

