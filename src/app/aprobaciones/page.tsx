'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Solicitud } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { createBrowserClient } from '@/lib/supabase'
import { CheckCircle, XCircle, HelpCircle, Clock, AlertTriangle } from 'lucide-react'

export default function AprobacionesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [selected, setSelected] = useState<Solicitud | null>(null)
  const [observacion, setObservacion] = useState('')
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/solicitudes?estado=pendiente')
    setSolicitudes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const urgentes = solicitudes.filter(s => {
    const dias = Math.ceil((new Date(s.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return dias <= 3 && dias >= 0
  })
  const vencidas = solicitudes.filter(s => new Date(s.fecha_limite) < new Date())
  const totalPendiente = solicitudes.reduce((sum, s) => sum + s.valor, 0)

  async function handleAccion(accion: 'aprobar' | 'rechazar' | 'aclaracion') {
    if (!selected) return
    setProcessing(true)
    const supabase = createBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()

    await fetch('/api/aprobaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solicitud_id: selected.id,
        accion,
        observacion,
        usuario_id: session?.user.id,
      }),
    })

    setSelected(null)
    setObservacion('')
    setProcessing(false)
    load()
  }

  return (
    <AppShell title="Centro de Aprobaciones" requiredRoles={['gerencia', 'admin']}>
      <div className="space-y-6">
        {/* Resumen */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3">
              <Clock className="text-yellow-500" size={24} />
              <div>
                <p className="text-2xl font-bold">{solicitudes.length}</p>
                <p className="text-sm text-gray-500">Pendientes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3">
              <div className="text-blue-600 font-bold text-lg">$</div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalPendiente)}</p>
                <p className="text-sm text-gray-500">Valor acumulado</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-500" size={24} />
              <div>
                <p className="text-2xl font-bold">{urgentes.length}</p>
                <p className="text-sm text-gray-500">Urgentes (≤3 días)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-500" size={24} />
              <div>
                <p className="text-2xl font-bold">{vencidas.length}</p>
                <p className="text-sm text-gray-500">Vencidas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Lista de pendientes */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 font-medium text-sm text-gray-700">Solicitudes pendientes</div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Cargando...</div>
            ) : solicitudes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No hay solicitudes pendientes</div>
            ) : (
              <div className="divide-y">
                {solicitudes.map(s => {
                  const dias = Math.ceil((new Date(s.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  const isUrgent = dias <= 3
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition ${selected?.id === s.id ? 'bg-blue-50 border-l-4 border-brand-600' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{s.proveedor?.razon_social}</p>
                          <p className="text-xs text-gray-500">{s.concepto}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatCurrency(s.valor)}</p>
                          <p className={`text-xs ${isUrgent ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                            {dias < 0 ? `Vencida hace ${Math.abs(dias)} días` : `${dias} días restantes`}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Panel de acción */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            {selected ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Detalle solicitud #{selected.numero}</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Proveedor:</span> {selected.proveedor?.razon_social}</p>
                  <p><span className="text-gray-500">NIT:</span> {selected.proveedor?.nit}</p>
                  <p><span className="text-gray-500">Concepto:</span> {selected.concepto}</p>
                  <p><span className="text-gray-500">Valor:</span> <strong>{formatCurrency(selected.valor)}</strong></p>
                  <p><span className="text-gray-500">Fecha límite:</span> {formatDate(selected.fecha_limite)}</p>
                  <p><span className="text-gray-500">Centro costo:</span> {selected.centro_costo || 'N/A'}</p>
                  {selected.observaciones && <p><span className="text-gray-500">Obs:</span> {selected.observaciones}</p>}
                  <p><span className="text-gray-500">Banco:</span> {selected.proveedor?.banco} - {selected.proveedor?.tipo_cuenta} {selected.proveedor?.numero_cuenta}</p>
                </div>

                <textarea
                  placeholder="Observación (opcional)"
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />

                <div className="space-y-2">
                  <button
                    onClick={() => handleAccion('aprobar')}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> Aprobar
                  </button>
                  <button
                    onClick={() => handleAccion('aclaracion')}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    <HelpCircle size={16} /> Solicitar aclaración
                  </button>
                  <button
                    onClick={() => handleAccion('rechazar')}
                    disabled={processing}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    <XCircle size={16} /> Rechazar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <p className="text-sm">Seleccione una solicitud para revisar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
