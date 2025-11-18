import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usuariosAPI } from '../services/api'

function Perfil() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [cidade, setCidade] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    carregarDadosUsuario()
  }, [])

  const carregarDadosUsuario = () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      
      if (!userData.id) {
        setError('Usuário não identificado. Faça login novamente.')
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      // Preencher os campos com os dados do usuário
      setNome(userData.nome || '')
      setEmail(userData.email || '')
      setCpf(userData.cpf || '')
      setDataNascimento(userData.data_nascimento ? userData.data_nascimento.split('T')[0] : '')
      setCidade(userData.cidade || '')
      
      setCarregando(false)
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error)
      setError('Erro ao carregar dados do usuário.')
      setCarregando(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!nome || !email || !cpf || !dataNascimento) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    // Validação de CPF (deve ter 11 dígitos)
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setError('CPF deve conter 11 dígitos')
      return
    }

    // Se a senha foi preenchida, validar
    if (senha || confirmarSenha) {
      if (senha !== confirmarSenha) {
        setError('As senhas não coincidem')
        return
      }

      if (senha.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres')
        return
      }
    }

    setLoading(true)

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userId = userData.id

      if (!userId) {
        setError('Usuário não identificado. Faça login novamente.')
        setTimeout(() => navigate('/login'), 2000)
        return
      }

      // Preparar dados para envio
      const dadosAtualizacao = {
        nome,
        email,
        cpf: cpf.replace(/\D/g, ''), // Remove formatação do CPF
        data_nascimento: dataNascimento,
        cidade: cidade || null,
      }

      // Só incluir senha se foi preenchida
      if (senha) {
        dadosAtualizacao.senha = senha
      }

      const response = await usuariosAPI.atualizar(userId, dadosAtualizacao)

      if (response.success) {
        setSuccess('Perfil atualizado com sucesso!')
        
        // Atualizar os dados no localStorage
        const dadosAtualizados = {
          ...userData,
          nome,
          email,
          cpf: cpf.replace(/\D/g, ''),
          data_nascimento: dataNascimento,
          cidade: cidade || null,
        }
        localStorage.setItem('userData', JSON.stringify(dadosAtualizados))
        
        // Limpar campos de senha
        setSenha('')
        setConfirmarSenha('')
        
        // Redirecionar para Home após 1.5 segundos
        setTimeout(() => {
          navigate('/home')
        }, 1500)
      } else {
        setError(response.message || 'Erro ao atualizar perfil')
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
      setError(
        err.response?.data?.message ||
          'Erro ao atualizar perfil. Tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando dados do perfil...</p>
        </div>
      </div>
    )
  }

  const userData = JSON.parse(localStorage.getItem('userData') || '{}')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Meu Perfil
              </h1>
              <p className="text-sm text-gray-600">
                Olá, {userData.nome || 'Usuário'}!
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/home')}
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                ← Voltar para Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Editar Perfil</h2>
            <p className="text-gray-600 mt-2">Atualize suas informações pessoais</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nome Completo *
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                E-mail *
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="cpf"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                CPF *
              </label>
              <input
                id="cpf"
                type="text"
                value={cpf}
                onChange={(e) => {
                  // Remove caracteres não numéricos e limita a 11 dígitos
                  const valor = e.target.value.replace(/\D/g, '').slice(0, 11)
                  setCpf(valor)
                }}
                onBlur={(e) => {
                  // Formata o CPF ao sair do campo
                  const valor = e.target.value.replace(/\D/g, '')
                  if (valor.length === 11) {
                    const formatado = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                    setCpf(formatado)
                  }
                }}
                onFocus={(e) => {
                  // Remove formatação ao focar no campo
                  const valor = e.target.value.replace(/\D/g, '')
                  setCpf(valor)
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="000.000.000-00"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Digite apenas os números do CPF</p>
            </div>

            <div>
              <label
                htmlFor="dataNascimento"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Data de Nascimento *
              </label>
              <input
                id="dataNascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                required
              />
            </div>

            <div>
              <label
                htmlFor="cidade"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Cidade
              </label>
              <input
                id="cidade"
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Sua cidade"
              />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-4">
                Alterar Senha (deixe em branco para manter a senha atual)
              </p>
              
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="senha"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nova Senha
                  </label>
                  <input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmarSenha"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirmar Nova Senha
                  </label>
                  <input
                    id="confirmarSenha"
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="Confirme sua senha"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default Perfil

