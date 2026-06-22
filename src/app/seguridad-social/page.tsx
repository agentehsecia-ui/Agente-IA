'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { SeguridadSocial } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { createBrowserClient } from '@/lib/supabase'
import { getPerfil } from '@/lib/auth'

const MESES = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function SeguridadSocialPage() {
  const [registros, setRegistros] = useState<SeguridadSocial[]>([])
  const [showForm, setShowForm] = useState(false)
  const [rol, setRol] = useState('')
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({ tipo_planilla: '', numero_planilla: '', periodo_mes: '', periodo_anio: '', valor: '', fecha_limite: '', observaciones: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/seguridad-social')
    setRegistros(await res.json())
  }

  useEffect(() => {
    load()
    getPerfil().then(p => { if (p) { setRol(p.rol); setUserId(p.id) } })
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/seguridad-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, periodo_mes: parseInt(form.periodo_mes), periodo_anio: parseInt(form.periodo_anio), creado_por: userId }),
    })
    setShowForm(false)
    setForm({ tipo_planilla: '', numero_planilla: '', periodo_mes: '', periodo_anio: '', valor: '', fecha_limite: '', observaciones: '' })
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
    await fetch('/api/seguridad-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    load()
  }

  const totalPagado = registros.filter(r => r.estado === 'pagada').reduce((s, r) => s + r.valor, 0)
  const pendientes = registros.filter(r => r.estado === 'pendiente').length
  const pagadas = registros.filter(r => r.estado === 'pagada').length

  return (
    <AppShell title="Seguridad Social">
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{pendientes}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Pagadas</p>
            <p className="text-2xl font-bold text-green-600">{pagadas}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-sm text-gray-500">Total pagado</p>
            <p className="text-2xl font-bold">{formatCurrency(totalPagado)}</p>
          </div>
        </div>

        {(rol === 'sostenibilidad' || rol === 'admin') && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {showForm ? 'Cancelar' : '+ Nueva planilla'}
          </button>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border p-6 space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de planilla *</label>
                <select required value={form.tipo_planilla} onChange={e => setForm(f => ({ ...f, tipo_planilla: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Seleccione</option>
                  <option value="E">E - Planilla empleados</option>
                  <option value="I">I - Planilla independientes</option>
                  <option value="S">S - Planilla empleados de servicio doméstico</option>
                  <option value="Y">Y - Planilla independientes empresas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número planilla</label>
                <input value={form.numero_planilla} onChange={e => setForm(f => ({ ...f, numero_planilla: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes *</label>
                <select required value={form.periodo_mes} onChange={e => setForm(f => ({ ...f, periodo_mes: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Mes</option>
                  {MESES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
                <input type="number" required min="2024" max="2030" value={form.periodo_anio} onChange={e => setForm(f => ({ ...f, periodo_anio: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                <input type="number" required min="1" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
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
              {saving ? 'Guardando...' : 'Crear planilla'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Periodo</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha límite</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {registros.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{r.tipo_planilla}</td>
                  <td className="px-4 py-3">{MESES[r.periodo_mes]} {r.periodo_anio}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(r.valor)}</td>
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
