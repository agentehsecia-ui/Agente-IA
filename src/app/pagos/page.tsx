'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Solicitud } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { createBrowserClient } from '@/lib/supabase'

export default function PagosPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [selected, setSelected] = useState<Solicitud | null>(null)
  const [form, setForm] = useState({ fecha_pago: '', numero_comprobante: '', es_parcial: false, valor_pagado: '', nota_parcial: '' })
  const [processing, setProcessing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'aprobada' | 'pagada'>('aprobada')

  async function load() {
    const res = await fetch(`/api/solicitudes?estado=${tab}`)
    setSolicitudes(await res.json())
    setLoading(false)
  }

  useEffect(() => { setLoading(true); load() }, [tab])

  async function handlePagar(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setProcessing(true)

    await fetch('/api/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        solicitud_id: selected.id,
        fecha_pago: form.fecha_pago,
        numero_comprobante: form.numero_comprobante,
        es_parcial: form.es_parcial,
        valor_pagado: form.es_parcial ? parseFloat(form.valor_pagado) : undefined,
        nota_parcial: form.nota_parcial,
      }),
    })

    setSelected(null)
    setForm({ fecha_pago: '', numero_comprobante: '', es_parcial: false, valor_pagado: '', nota_parcial: '' })
    setProcessing(false)
    load()
  }

  // También cargar pagadas parciales
  const [parciales, setParciales] = useState<Solicitud[]>([])
  useEffect(() => {
    fetch('/api/solicitudes?estado=pagada_parcial')
      .then(r => r.json())
      .then(setParciales)
  }, [])

  const pendientesPago = tab === 'aprobada' ? [...solicitudes, ...parciales] : solicitudes

  return (
    <AppShell title="Cola de Pagos" requiredRoles={['gerencia', 'admin']}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setTab('aprobada')}
            className={`px-4 py-2 rounded-lg text-sm ${tab === 'aprobada' ? 'bg-brand-600 text-white' : 'bg-white border text-gray-600'}`}
          >
            Pendientes de pago
          </button>
          <button
            onClick={() => setTab('pagada')}
            className={`px-4 py-2 rounded-lg text-sm ${tab === 'pagada' ? 'bg-brand-600 text-white' : 'bg-white border text-gray-600'}`}
          >
            Pagadas
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Concepto</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Límite</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
                ) : pendientesPago.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin registros</td></tr>
                ) : (
                  pendientesPago.map(s => (
                    <tr
                      key={s.id}
                      onClick={() => tab === 'aprobada' ? setSelected(s) : null}
                      className={`border-b hover:bg-gray-50 ${tab === 'aprobada' ? 'cursor-pointer' : ''} ${selected?.id === s.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3 text-gray-500">{s.numero}</td>
                      <td className="px-4 py-3 font-medium">{s.proveedor?.razon_social}</td>
                      <td className="px-4 py-3 text-gray-600">{s.concepto}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.valor)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(s.fecha_limite)}</td>
                      <td className="px-4 py-3"><Badge estado={s.estado} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Panel de registro de pago */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            {selected && tab === 'aprobada' ? (
              <form onSubmit={handlePagar} className="space-y-4">
                <h3 className="font-semibold">Registrar pago</h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{selected.proveedor?.razon_social}</p>
                  <p className="text-gray-500">{selected.concepto}</p>
                  <p className="font-bold text-lg">{formatCurrency(selected.valor)}</p>
                  {selected.valor_pagado > 0 && (
                    <p className="text-green-600 text-xs">Ya pagado: {formatCurrency(selected.valor_pagado)}</p>
                  )}
                  <p className="text-xs text-gray-400">Cuenta: {selected.proveedor?.banco} {selected.proveedor?.numero_cuenta}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de pago *</label>
                  <input type="date" required value={form.fecha_pago} onChange={e => setForm(f => ({ ...f, fecha_pago: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº Comprobante *</label>
                  <input type="text" required value={form.numero_comprobante} onChange={e => setForm(f => ({ ...f, numero_comprobante: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.es_parcial} onChange={e => setForm(f => ({ ...f, es_parcial: e.target.checked }))} />
                  Pago parcial
                </label>

                {form.es_parcial && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor pagado *</label>
                      <input type="number" required min="1" value={form.valor_pagado} onChange={e => setForm(f => ({ ...f, valor_pagado: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nota de pago parcial</label>
                      <textarea value={form.nota_parcial} onChange={e => setForm(f => ({ ...f, nota_parcial: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
                    </div>
                  </>
                )}

                <button type="submit" disabled={processing} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {processing ? 'Registrando...' : 'Registrar pago'}
                </button>
              </form>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <p className="text-sm">{tab === 'aprobada' ? 'Seleccione una solicitud para registrar pago' : 'Historial de pagos'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
