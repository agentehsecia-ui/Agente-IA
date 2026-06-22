'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { Perfil } from '@/lib/types'
import { createBrowserClient } from '@/lib/supabase'

export default function AdminPage() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'sostenibilidad' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.from('perfiles').select('*').order('nombre').then(({ data }) => setUsuarios(data || []))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')

    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setUsuarios(prev => [...prev, data])
      setShowForm(false)
      setForm({ email: '', password: '', nombre: '', rol: 'sostenibilidad' })
      setMsg('Usuario creado exitosamente')
    } catch (err: any) {
      setMsg(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Administración" requiredRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Usuarios del sistema</h3>
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            {showForm ? 'Cancelar' : '+ Nuevo usuario'}
          </button>
        </div>

        {msg && <div className={`px-4 py-2 rounded-lg text-sm ${msg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</div>}

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border p-6 space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
              <input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
              <input type="password" required minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
              <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="sostenibilidad">Sostenibilidad</option>
                <option value="gerencia">Gerencia</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button type="submit" disabled={saving} className="bg-brand-600 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? 'Creando...' : 'Crear usuario'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.rol}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
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
