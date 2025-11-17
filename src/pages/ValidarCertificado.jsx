import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { certificadoAPI } from '../services/api'

function ValidarCertificado() {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResultado(null)

    if (!codigo.trim()) {
      setResultado({
        success: false,
        message: 'Por favor, informe o código do certificado',
      })
      setLoading(false)
      return
    }

    try {
      const response = await certificadoAPI.validar(codigo)
      setResultado(response)
    } catch (error) {
      setResultado({
        success: false,
        message:
          error.response?.data?.message ||
          'Erro ao validar certificado. Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Validar Certificado
            </h1>
            <p className="text-gray-600 mt-2">
              Digite o código do certificado para validar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="codigo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Código do Certificado
              </label>
              <input
                id="codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono text-lg"
                placeholder="Digite o código aqui..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? 'Validando...' : 'Validar Certificado'}
            </button>
          </form>

          {/* Resultado */}
          {resultado && (
            <div
              className={`mt-6 p-6 rounded-lg border-l-4 ${
                resultado.success
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {resultado.success ? (
                    <svg
                      className="h-6 w-6 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6 text-red-500"
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
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <h3
                    className={`text-sm font-semibold ${
                      resultado.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {resultado.success ? 'Certificado Válido!' : 'Erro na Validação'}
                  </h3>
                  <p
                    className={`mt-1 text-sm ${
                      resultado.success ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {resultado.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="text-center pt-4 border-t border-gray-200">
            <button
              onClick={() => navigate('/home')}
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              ← Voltar para Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ValidarCertificado

