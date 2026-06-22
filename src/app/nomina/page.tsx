'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Nomina } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { getPerfil } from '@/lib/auth'

const TIPOS_NOMINA: Record<string, string> = {
  quincenal: 'Quincenal', mensual: 'Mensual', prima: 'Prima',
  cesantias: 'Cesantías', liquidacion: 'Liquidación', otro: 'Otro',
}

export default function NominaPage() {
  const [registros, setRegistros] = useState<Nomina[]>([])
  const [showForm, setShowForm] = useState(false)
  const [rol, setRol] = useState('')
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({ periodo: '', tipo_nomina: 'quincenal', valor_total: '', cantidad_colaboradores: '', fecha_limite: '', observaciones: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/nomina')
    setRegistros(await res.json())
  }

  useEffect(() => {
    load()
    getPerfil().then(p => { if (p) { setRol(p.rol); setUserId(p.id) } })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/nomina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        valor_total: parseFloat(form.valor_total),
        cantidad_colaboradores: form.cantidad_colaboradores ? parseInt(form.cantidad_colaboradores) : null,
        creado_por: userId,
      }),
    })
    setShowForm(false)
    setForm({ periodo: '', tipo_nomina: 'quincenal', valor_total: '', cantidad_colaboradores: '', fecha_limite: '', observaciones: '' })
    setSaving(false)
    load()
  }

  async function handleAction(id: string, accion: string) {
    const body: any = { id, accion, usuario_id: userId }
    if (accion === 'pagar') {
      const fecha = prompt('Fecha de pago (YYYY-MM-DD):')
      const comp = prompt('Número de comprobante:')
      if (!fecha || !comp) return
      body.fecha_pago = fecha
      body.numero_comprobante = comp
    }
    await fetch('/api/nomina', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    load()
  }

  const totalPagado = registros.filter(r => r.estado === 'pagada').reduce((s, r) => s + r.valor_total, 0)

  return (
    <AppShell title="Nómina">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{registros.filter(r => r.estado === 'pendiente').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Pagadas</p>
            <p className="text-2xl font-bold text-green-600">{registros.filter(r => r.estado === 'pagada').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Total pagado</p>
            <p className="text-2xl font-bold">{formatCurrency(totalPagado)}</p>
          </div>
        </div>

        {(rol === 'sostenibilidad' || rol === 'admin') && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {showForm ? 'Cancelar' : '+ Nueva nómina'}
          </button>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border p-6 space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periodo *</label>
                <input required placeholder="Ej: 1-15 Jun 2026" value={form.periodo} onChange={e => setForm(f => ({ ...f, periodo: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select required value={form.tipo_nomina} onChange={e => setForm(f => ({ ...f, tipo_nomina: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {Object.entries(TIPOS_NOMINA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor total *</label>
                <input type="number" required min="1" value={form.valor_total} onChange={e => setForm(f => ({ ...f, valor_total: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colaboradores</label>
                <input type="number" min="1" value={form.cantidad_colaboradores} onChange={e => setForm(f => ({ ...f, cantidad_colaboradores: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite *</label>
                <input type="date" required value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
            </div>
            <button type="submit" disabled={saving} className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear nómina'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Periodo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Colaboradores</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Límite</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.periodo}</td>
                  <td className="px-4 py-3">{TIPOS_NOMINA[r.tipo_nomina] || r.tipo_nomina}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(r.valor_total)}</td>
                  <td className="px-4 py-3 text-right">{r.cantidad_colaboradores || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(r.fecha_limite)}</td>
                  <td className="px-4 py-3"><Badge estado={r.estado} /></td>
                  <td className="px-4 py-3">
                    {r.estado === 'pendiente' && rol === 'gerencia' && (
                      <button onClick={() => handleAction(r.id, 'aprobar')} className="text-green-600 hover:underline text-xs mr-2">Aprobar</button>
                    )}
                    {r.estado === 'aprobada' && rol === 'gerencia' && (
                      <button onClick={() => handleAction(r.id, 'pagar')} className="text-blue-600 hover:underline text-xs">Registrar pago</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
