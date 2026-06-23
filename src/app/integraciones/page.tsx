'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'

export default function IntegracionesPage() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function handleSync() {
    setSyncing(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/alegra/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <AppShell title="Integraciones" requiredRoles={['sostenibilidad', 'admin']}>
      <div className="max-w-2xl space-y-6">
        {/* Alegra */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Alegra</h3>
              <p className="text-sm text-gray-500">Sincroniza facturas de compra y documentos soporte como solicitudes de pago</p>
            </div>
            <div className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">Conectado</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium text-gray-700">¿Cómo funciona?</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Clic en <strong>"Sincronizar ahora"</strong> para importar facturas pendientes de Alegra</li>
              <li>Las facturas llegan como solicitudes en estado <strong>"Borrador"</strong></li>
              <li>Sostenibilidad revisa, agrega datos bancarios y centro de costo</li>
              <li>Envía a aprobación de Gerencia</li>
              <li>Cuando Gerencia paga y sube el soporte, el pago se aplica automáticamente en Alegra</li>
            </ol>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={16} />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                <p className="font-medium text-green-800 text-sm">Sincronización completada</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white rounded p-2">
                  <p className="text-gray-500 text-xs">En Alegra</p>
                  <p className="font-bold">{result.total_alegra} facturas</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-gray-500 text-xs">Con saldo pendiente</p>
                  <p className="font-bold">{result.pendientes}</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-gray-500 text-xs">Nuevas importadas</p>
                  <p className="font-bold text-green-600">{result.importados}</p>
                </div>
                <div className="bg-white rounded p-2">
                  <p className="text-gray-500 text-xs">Ya existían</p>
                  <p className="font-bold text-gray-400">{result.existentes}</p>
                </div>
              </div>
              {result.errores > 0 && (
                <p className="text-xs text-red-500">{result.errores} errores al importar</p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
