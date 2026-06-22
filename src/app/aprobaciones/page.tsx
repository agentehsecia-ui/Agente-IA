'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Solicitud } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { createBrowserClient } from '@/lib/supabase'
import { CheckCircle, XCircle, HelpCircle, Clock, AlertTriangle, FileText, Download } from 'lucide-react'

export default function AprobacionesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [observacion, setObservacion] = useState('')
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  async function load() {
    const res = await fetch('/api/solicitudes?estado=pendiente')
    setSolicitudes(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function loadDetail(s: Solicitud) {
    const res = await fetch(`/api/solicitudes/${s.id}`)
    const detail = await res.json()
    setSelected(detail)
    setObservacion('')
    setMsg('')
  }

  const urgentes = solicitudes.filter(s => {
    const dias = Math.ceil((new Date(s.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return dias <= 3 && dias >= 0
  })
  const vencidas = solicitudes.filter(s => new Date(s.fecha_limite) < new Date())
  const totalPendiente = solicitudes.reduce((sum, s) => sum + s.valor, 0)

  async function handleAccion(accion: 'aprobar' | 'rechazar' | 'aclaracion') {
    if (!selected) return

    if ((accion === 'rechazar' || accion === 'aclaracion') && !observacion.trim()) {
      setMsg('Debe escribir una observación para rechazar o solicitar aclaración')
      return
    }

    // Validar datos bancarios antes de aprobar
    if (accion === 'aprobar' && (!selected.proveedor?.banco || !selected.proveedor?.numero_cuenta)) {
      setMsg('⚠️ El proveedor no tiene datos bancarios completos. Agregue los datos bancarios antes de aprobar.')
      return
    }

    setProcessing(true)
    setMsg('')
    const supabase = createBrowserClient()
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/aprobaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solicitud_id: selected.id,
        accion,
        observacion,
        usuario_id: session?.user.id,
      }),
    })

    if (res.ok) {
      const accionLabel = accion === 'aprobar' ? 'aprobada' : accion === 'rechazar' ? 'rechazada' : 'enviada a aclaración'
      setMsg(`✅ Solicitud ${accionLabel} correctamente`)
      setSelected(null)
      setObservacion('')
      load()
    } else {
      const data = await res.json()
      setMsg(`Error: ${data.error}`)
    }
    setProcessing(false)
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
                <p className="text-sm text-gray-500">Urgentes (3 días)</p>
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

        {msg && (
          <div className={`px-4 py-2 rounded-lg text-sm ${msg.startsWith('Error') || msg.startsWith('⚠️') || msg.startsWith('Debe') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Lista de pendientes */}
          <div className="col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 font-medium text-sm text-gray-700">Solicitudes pendientes</div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Cargando...</div>
            ) : solicitudes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No hay solicitudes pendientes</div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {solicitudes.map(s => {
                  const dias = Math.ceil((new Date(s.fecha_limite).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  const isUrgent = dias <= 3
                  return (
                    <button
                      key={s.id}
                      onClick={() => loadDetail(s)}
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

          {/* Panel de detalle y acción */}
          <div className="bg-white rounded-xl shadow-sm border p-5 max-h-[700px] overflow-y-auto">
            {selected ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Solicitud #{selected.numero}</h3>

                {/* Datos del proveedor destacados */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <p className="font-medium text-sm">{selected.proveedor?.razon_social}</p>
                  <p className="text-xs text-gray-500">NIT/CC: {selected.proveedor?.nit}</p>
                  {selected.proveedor?.banco ? (
                    <div className="mt-2 bg-blue-50 rounded p-2">
                      <p className="text-xs font-medium text-blue-800">Datos bancarios:</p>
                      <p className="text-xs text-blue-700">{selected.proveedor.banco} — {selected.proveedor.tipo_cuenta}</p>
                      <p className="text-xs text-blue-700 font-mono">{selected.proveedor.numero_cuenta}</p>
                    </div>
                  ) : (
                    <div className="mt-2 bg-red-50 rounded p-2">
                      <p className="text-xs text-red-600 font-medium">⚠️ Sin datos bancarios</p>
                    </div>
                  )}
                </div>

                {/* Detalle del pago */}
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Concepto:</span> {selected.concepto}</p>
                  <p><span className="text-gray-500">Valor:</span> <strong className="text-lg">{formatCurrency(selected.valor)}</strong></p>
                  <p><span className="text-gray-500">Fecha límite:</span> {formatDate(selected.fecha_limite)}</p>
                  {selected.centro_costo && <p><span className="text-gray-500">Centro costo:</span> {selected.centro_costo}</p>}
                  {selected.referencia_interna && <p><span className="text-gray-500">Ref. interna:</span> {selected.referencia_interna}</p>}
                  {selected.observaciones && <p><span className="text-gray-500">Obs:</span> {selected.observaciones}</p>}
                </div>

                {/* Beneficiarios múltiples */}
                {selected.beneficiarios && selected.beneficiarios.length > 1 && (
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-yellow-800 mb-2">Múltiples beneficiarios ({selected.beneficiarios.length}):</p>
                    {selected.beneficiarios.map((b: any) => (
                      <div key={b.id} className="text-xs border-b border-yellow-200 py-1.5 last:border-0">
                        <p className="font-medium">{b.proveedor?.razon_social} — {formatCurrency(b.valor)}</p>
                        <p className="text-yellow-700">{b.concepto}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adjuntos */}
                {selected.adjuntos && selected.adjuntos.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-600">Documentos adjuntos:</p>
                    {selected.adjuntos.map((a: any) => (
                      <a
                        key={a.id}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-brand-600 hover:underline bg-gray-50 px-2 py-1.5 rounded"
                      >
                        <FileText size={14} />
                        {a.nombre_archivo}
                      </a>
                    ))}
                  </div>
                )}

                {/* Observación */}
                <textarea
                  placeholder={`Observación ${selected ? '(obligatoria para rechazar o aclarar)' : ''}`}
                  value={observacion}
                  onChange={e => setObservacion(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />

                {/* Acciones */}
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
