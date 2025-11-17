import { useOffline } from '../hooks/useOffline'

function OfflineIndicator() {
  const { online, pendingCount, syncing, sync } = useOffline()

  if (online && pendingCount === 0) {
    return null
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        !online
          ? 'bg-red-500 text-white'
          : syncing
          ? 'bg-yellow-500 text-white'
          : 'bg-green-500 text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {!online ? (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <div>
              <p className="font-semibold">Modo Offline</p>
              <p className="text-sm">
                {pendingCount > 0
                  ? `${pendingCount} operação(ões) pendente(s)`
                  : 'Sem conexão com a internet'}
              </p>
            </div>
          </>
        ) : syncing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <div>
              <p className="font-semibold">Sincronizando...</p>
              <p className="text-sm">Enviando dados para o servidor</p>
            </div>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <div>
              <p className="font-semibold">Online</p>
              <p className="text-sm">
                {pendingCount > 0
                  ? `${pendingCount} operação(ões) pendente(s)`
                  : 'Tudo sincronizado'}
              </p>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={sync}
                className="ml-2 px-3 py-1 bg-white text-green-600 rounded font-semibold hover:bg-gray-100 transition-colors"
              >
                Sincronizar
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OfflineIndicator

