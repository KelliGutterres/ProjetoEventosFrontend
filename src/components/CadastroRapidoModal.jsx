import { useState } from 'react'

function CadastroRapidoModal({ evento, onClose, onSuccess }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [cpf, setCpf] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [cidade, setCidade] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!nome || !email || !cpf || !dataNascimento || !senha || !confirmarSenha) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    // Validação de CPF (deve ter 11 dígitos)
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      setError('CPF deve conter 11 dígitos')
      return
    }

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem')
      return
    }

    if (senha.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const dadosUsuario = {
        nome,
        email,
        senha,
        cpf: cpf.replace(/\D/g, ''), // Remove formatação do CPF
        data_nascimento: dataNascimento,
        cidade: cidade || null,
      }

      // Chamar callback de sucesso que fará o cadastro + inscrição + presença
      await onSuccess(dadosUsuario)
      
      // Limpar formulário
      setNome('')
      setEmail('')
      setSenha('')
      setConfirmarSenha('')
      setCpf('')
      setDataNascimento('')
      setCidade('')
    } catch (err) {
      console.error('Erro no cadastro:', err)
      setError(
        err.response?.data?.message ||
          'Erro ao processar cadastro. Tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (data) => {
    if (!data) return 'N/A'
    return new Date(data).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cadastro Rápido</h2>
              <p className="text-sm text-gray-600 mt-1">
                Evento: {evento?.descricao || 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Data: {formatarData(evento?.data_inicio)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Sua cidade"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="senha"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Senha *
                </label>
                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirmarSenha"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirmar Senha *
                </label>
                <input
                  id="confirmarSenha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Confirme sua senha"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading
                  ? 'Processando...'
                  : 'Cadastrar, Inscrever e Registrar Presença'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CadastroRapidoModal

