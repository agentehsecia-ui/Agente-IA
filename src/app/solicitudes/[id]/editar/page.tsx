'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ProveedorSearch from '@/components/ProveedorSearch'
import { Proveedor } from '@/lib/types'
import { formatCurrency } from '@/lib/format'
import { AlertTriangle } from 'lucide-react'

export default function EditarSolicitud() {
  const router = useRouter()
  const params = useParams()
  const [solicitud, setSolicitud] = useState<any>(null)
  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [form, setForm] = useState({
    concepto: '', valor: '', fecha_limite: '', centro_costo: '', observaciones: '', referencia_interna: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/solicitudes/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setLoading(false); return }
        setSolicitud(data)
        setProveedor(data.proveedor)
        setForm({
          concepto: data.concepto || '',
          valor: String(data.valor) || '',
          fecha_limite: data.fecha_limite || '',
          centro_costo: data.centro_costo || '',
          observaciones: data.observaciones || '',
          referencia_interna: data.referencia_interna || '',
        })
        setLoading(false)
      })
  }, [params.id])

  async function handleSubmit(e: React.FormEvent, reenviar: boolean) {
    e.preventDefault()
    if (!proveedor) { setError('Seleccione un proveedor'); return }
    setSaving(true)
    setError('')

    const res = await fetch(`/api/solicitudes/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        valor: parseFloat(form.valor),
        proveedor_id: proveedor.id,
        reenviar,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }

    router.push('/solicitudes')
  }

  if (loading) return <AppShell title="Editar Solicitud"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div></AppShell>

  if (!solicitud || solicitud.estado !== 'aclaracion') {
    return (
      <AppShell title="Editar Solicitud">
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">Esta solicitud no se puede editar. Solo se pueden editar solicitudes en estado de aclaración.</p>
          <button onClick={() => router.push('/solicitudes')} className="mt-4 text-brand-600 hover:underline text-sm">Volver a solicitudes</button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Editar Solicitud" requiredRoles={['sostenibilidad', 'admin']}>
      <form onSubmit={e => handleSubmit(e, false)} className="max-w-3xl mx-auto space-y-6">
        {/* Mensaje de aclaración de gerencia */}
        {solicitud.observacion_aclaracion && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="text-orange-500 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-medium text-orange-800 text-sm">Gerencia solicita aclaración:</p>
              <p className="text-orange-700 text-sm mt-1">{solicitud.observacion_aclaracion}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4 overflow-visible">
          <h3 className="font-semibold text-gray-800">Proveedor / Tercero</h3>
          <ProveedorSearch selected={proveedor} onSelect={setProveedor} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5 overflow-visible">
          <h3 className="font-semibold text-gray-800">Detalle del pago</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
              <input type="text" required value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (COP) *</label>
              <input type="number" required min="1" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite *</label>
              <input type="date" required value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centro de costo</label>
              <input type="text" value={form.centro_costo} onChange={e => setForm(f => ({ ...f, centro_costo: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referencia interna</label>
              <input type="text" value={form.referencia_interna} onChange={e => setForm(f => ({ ...f, referencia_interna: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={e => handleSubmit(e as any, true)}
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
          >
            {saving ? 'Enviando...' : 'Corregir y reenviar a Gerencia'}
          </button>
          <button type="button" onClick={() => router.push('/solicitudes')} className="text-gray-600 hover:text-gray-800 px-4 py-2.5">
            Cancelar
          </button>
        </div>
      </form>
    </AppShell>
  )
}
