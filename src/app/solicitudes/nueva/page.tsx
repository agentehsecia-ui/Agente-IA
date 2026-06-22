'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ProveedorSearch from '@/components/ProveedorSearch'
import { Proveedor } from '@/lib/types'
import { createBrowserClient } from '@/lib/supabase'
import { TIPO_PAGO_LABELS } from '@/lib/format'

export default function NuevaSolicitud() {
  const router = useRouter()
  const [proveedor, setProveedor] = useState<Proveedor | null>(null)
  const [form, setForm] = useState({
    tipo_pago: 'proveedor',
    concepto: '',
    valor: '',
    fecha_limite: '',
    centro_costo: '',
    observaciones: '',
  })
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    for (const f of selected) {
      if (!['application/pdf', 'image/jpeg', 'image/jpg'].includes(f.type)) {
        setError('Solo se permiten archivos PDF o JPG')
        return
      }
      if (f.size > 2 * 1024 * 1024) {
        setError('El tamaño máximo por archivo es 2MB')
        return
      }
    }
    setError('')
    setFiles(prev => [...prev, ...selected])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!proveedor) { setError('Seleccione un proveedor'); return }
    setSaving(true)
    setError('')

    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No autenticado')

      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor: parseFloat(form.valor),
          proveedor_id: proveedor.id,
          creado_por: session.user.id,
        }),
      })
      const solicitud = await res.json()
      if (!res.ok) throw new Error(solicitud.error)

      // Subir adjuntos
      for (const file of files) {
        const path = `${solicitud.id}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('adjuntos')
          .upload(path, file)

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('adjuntos').getPublicUrl(path)
          await supabase.from('adjuntos').insert({
            solicitud_id: solicitud.id,
            nombre_archivo: file.name,
            tipo: 'otro',
            url: urlData.publicUrl,
            tamano_bytes: file.size,
            mime_type: file.type,
          })
        }
      }

      router.push('/solicitudes')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Nueva Solicitud de Pago" requiredRoles={['sostenibilidad', 'admin']}>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <h3 className="font-semibold text-gray-800">Proveedor / Tercero</h3>
          <ProveedorSearch selected={proveedor} onSelect={setProveedor} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <h3 className="font-semibold text-gray-800">Detalle del pago</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pago *</label>
              <select
                value={form.tipo_pago}
                onChange={e => setForm(f => ({ ...f, tipo_pago: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {Object.entries(TIPO_PAGO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (COP) *</label>
              <input
                type="number"
                required
                min="1"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
            <input
              type="text"
              required
              value={form.concepto}
              onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Descripción del pago"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite de pago *</label>
              <input
                type="date"
                required
                value={form.fecha_limite}
                onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centro de costo</label>
              <input
                type="text"
                value={form.centro_costo}
                onChange={e => setForm(f => ({ ...f, centro_costo: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={3}
              placeholder="Información adicional"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Documentos adjuntos</h3>
          <p className="text-xs text-gray-500">Solo PDF o JPG, máximo 2MB por archivo</p>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg"
            multiple
            onChange={handleFileChange}
            className="text-sm"
          />
          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-1.5 rounded">
                  <span>{f.name} ({(f.size / 1024).toFixed(0)} KB)</span>
                  <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-red-500 text-xs">Eliminar</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50"
          >
            {saving ? 'Enviando...' : 'Enviar solicitud'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/solicitudes')}
            className="text-gray-600 hover:text-gray-800 px-4 py-2.5"
          >
            Cancelar
          </button>
        </div>
      </form>
    </AppShell>
  )
}
