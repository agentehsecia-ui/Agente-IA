'use client'

import { useState } from 'react'
import AppShell from '@/components/AppShell'
import { createBrowserClient } from '@/lib/supabase'

export default function PerfilPage() {
  const [current, setCurrent] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')

    if (nueva.length < 6) {
      setMsg('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (nueva !== confirmar) {
      setMsg('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.auth.updateUser({ password: nueva })

    if (error) {
      setMsg(`Error: ${error.message}`)
    } else {
      setMsg('Contraseña actualizada correctamente')
      setCurrent('')
      setNueva('')
      setConfirmar('')
    }
    setLoading(false)
  }

  return (
    <AppShell title="Mi Perfil">
      <div className="max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <h3 className="font-semibold text-gray-800">Cambiar contraseña</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña *</label>
            <input
              type="password"
              required
              minLength={6}
              value={nueva}
              onChange={e => setNueva(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña *</label>
            <input
              type="password"
              required
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Repita la contraseña"
            />
          </div>

          {msg && (
            <div className={`px-4 py-2 rounded-lg text-sm ${msg.startsWith('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
