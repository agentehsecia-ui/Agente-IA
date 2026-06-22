'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { Perfil } from '@/lib/types'
import { createBrowserClient } from '@/lib/supabase'
import { Key, Trash2, UserX, UserCheck } from 'lucide-react'

export default function AdminPage() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'sostenibilidad' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [passModal, setPassModal] = useState<Perfil | null>(null)
  const [newPass, setNewPass] = useState('')

  function loadUsers() {
    const supabase = createBrowserClient()
    supabase.from('perfiles').select('*').order('nombre').then(({ data }) => setUsuarios(data || []))
  }

  useEffect(() => { loadUsers() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, accion: 'crear' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowForm(false)
      setForm({ email: '', password: '', nombre: '', rol: 'sostenibilidad' })
      setMsg('Usuario creado exitosamente')
      loadUsers()
    } catch (err: any) {
      setMsg(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!passModal || newPass.length < 6) return
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'cambiar_password', user_id: passModal.id, password: newPass }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg(`Contraseña de ${passModal.nombre} actualizada`)
      setPassModal(null)
      setNewPass('')
    } else {
      setMsg(`Error: ${data.error}`)
    }
  }

  async function handleToggleActivo(user: Perfil) {
    const action = user.activo ? 'desactivar' : 'activar'
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} al usuario ${user.nombre}?`)) return
    await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'toggle_activo', user_id: user.id, activo: !user.activo }),
    })
    setMsg(`Usuario ${user.nombre} ${user.activo ? 'desactivado' : 'activado'}`)
    loadUsers()
  }

  async function handleChangeRol(user: Perfil, newRol: string) {
    await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'cambiar_rol', user_id: user.id, rol: newRol }),
    })
    setMsg(`Rol de ${user.nombre} cambiado a ${newRol}`)
    loadUsers()
  }

  async function handleDelete(user: Perfil) {
    if (!confirm(`¿Eliminar permanentemente a ${user.nombre}? Esta acción no se puede deshacer.`)) return
    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'eliminar', user_id: user.id }),
    })
    if (res.ok) {
      setMsg(`Usuario ${user.nombre} eliminado`)
      loadUsers()
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

        {/* Modal cambiar contraseña */}
        {passModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <form onSubmit={handleChangePassword} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
              <h3 className="font-semibold">Cambiar contraseña</h3>
              <p className="text-sm text-gray-500">{passModal.nombre} ({passModal.email})</p>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Nueva contraseña (mín 6 caracteres)"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Cambiar</button>
                <button type="button" onClick={() => { setPassModal(null); setNewPass('') }} className="text-gray-500 text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.rol}
                      onChange={e => handleChangeRol(u, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="sostenibilidad">Sostenibilidad</option>
                      <option value="gerencia">Gerencia</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setPassModal(u)} title="Cambiar contraseña" className="p-1.5 hover:bg-blue-50 rounded text-blue-600">
                        <Key size={15} />
                      </button>
                      <button onClick={() => handleToggleActivo(u)} title={u.activo ? 'Desactivar' : 'Activar'} className="p-1.5 hover:bg-yellow-50 rounded text-yellow-600">
                        {u.activo ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                      <button onClick={() => handleDelete(u)} title="Eliminar" className="p-1.5 hover:bg-red-50 rounded text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
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
