'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import ProveedorSearch from '@/components/ProveedorSearch'
import { Proveedor } from '@/lib/types'
import { createBrowserClient } from '@/lib/supabase'
import { TIPO_PAGO_LABELS, formatCurrency } from '@/lib/format'
import { Trash2, Plus } from 'lucide-react'

interface Beneficiario {
  proveedor: Proveedor | null
  concepto: string
  valor: string
  referencia_interna: string
}

export default function NuevaSolicitud() {
  const router = useRouter()
  const [form, setForm] = useState({
    tipo_pago: 'proveedor',
    fecha_limite: '',
    centro_costo: '',
    observaciones: '',
  })
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([
    { proveedor: null, concepto: '', valor: '', referencia_interna: '' }
  ])
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addBeneficiario() {
    setBeneficiarios(prev => [...prev, { proveedor: null, concepto: '', valor: '', referencia_interna: '' }])
  }

  function removeBeneficiario(index: number) {
    if (beneficiarios.length === 1) return
    setBeneficiarios(prev => prev.filter((_, i) => i !== index))
  }

  function updateBeneficiario(index: number, field: string, value: any) {
    setBeneficiarios(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b))
  }

  const totalValor = beneficiarios.reduce((sum, b) => sum + (parseFloat(b.valor) || 0), 0)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    for (const f of selected) {
      if (!['application/pdf', 'image/jpeg', 'image/jpg'].includes(f.type)) {
        setError('Solo se permiten archivos PDF o JPG'); return
      }
      if (f.size > 2 * 1024 * 1024) {
        setError('El tamaño máximo por archivo es 2MB'); return
      }
    }
    setError('')
    setFiles(prev => [...prev, ...selected])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sinProveedor = beneficiarios.find(b => !b.proveedor)
    if (sinProveedor) { setError('Todos los beneficiarios deben tener un proveedor seleccionado'); return }
    const sinValor = beneficiarios.find(b => !b.valor || parseFloat(b.valor) <= 0)
    if (sinValor) { setError('Todos los beneficiarios deben tener un valor mayor a 0'); return }
    const sinConcepto = beneficiarios.find(b => !b.concepto.trim())
    if (sinConcepto) { setError('Todos los beneficiarios deben tener un concepto'); return }

    setSaving(true)
    setError('')

    try {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No autenticado')

      // Crear solicitud principal con el primer beneficiario
      const primerB = beneficiarios[0]
      const res = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          concepto: beneficiarios.length === 1
            ? primerB.concepto
            : `${beneficiarios.length} beneficiarios - ${primerB.concepto} y otros`,
          valor: totalValor,
          proveedor_id: primerB.proveedor!.id,
          referencia_interna: primerB.referencia_interna,
          creado_por: session.user.id,
        }),
      })
      const solicitud = await res.json()
      if (!res.ok) throw new Error(solicitud.error)

      // Guardar beneficiarios adicionales
      if (beneficiarios.length > 1) {
        const benefs = beneficiarios.map(b => ({
          solicitud_id: solicitud.id,
          proveedor_id: b.proveedor!.id,
          concepto: b.concepto,
          valor: parseFloat(b.valor),
          referencia_interna: b.referencia_interna || null,
        }))
        await supabase.from('solicitud_beneficiarios').insert(benefs)
      }

      // Subir adjuntos
      for (const file of files) {
        const path = `${solicitud.id}/${Date.now()}_${file.name}`
        const { error: uploadError } = await supabase.storage.from('adjuntos').upload(path, file)
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
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        {/* Beneficiarios */}
        {beneficiarios.map((b, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                {beneficiarios.length === 1 ? 'Proveedor / Tercero' : `Beneficiario ${i + 1}`}
              </h3>
              {beneficiarios.length > 1 && (
                <button type="button" onClick={() => removeBeneficiario(i)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <ProveedorSearch
              selected={b.proveedor}
              onSelect={p => updateBeneficiario(i, 'proveedor', p)}
            />
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
                <input
                  type="text"
                  required
                  value={b.concepto}
                  onChange={e => updateBeneficiario(i, 'concepto', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Descripción del pago"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (COP) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={b.valor}
                  onChange={e => updateBeneficiario(i, 'valor', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referencia interna</label>
              <input
                type="text"
                value={b.referencia_interna}
                onChange={e => updateBeneficiario(i, 'referencia_interna', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Ej: DS548"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addBeneficiario}
          className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-medium"
        >
          <Plus size={16} /> Agregar otro beneficiario
        </button>

        {beneficiarios.length > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <strong>Total: {formatCurrency(totalValor)}</strong> — {beneficiarios.length} beneficiarios
          </div>
        )}

        {/* Detalles generales */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
          <h3 className="font-semibold text-gray-800">Detalles generales</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de pago *</label>
              <select value={form.tipo_pago} onChange={e => setForm(f => ({ ...f, tipo_pago: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                {Object.entries(TIPO_PAGO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite de pago *</label>
              <input type="date" required value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centro de costo</label>
              <input type="text" value={form.centro_costo} onChange={e => setForm(f => ({ ...f, centro_costo: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Opcional" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} placeholder="Información adicional" />
          </div>
        </div>

        {/* Adjuntos */}
        <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Documentos adjuntos</h3>
          <p className="text-xs text-gray-500">Solo PDF o JPG, máximo 2MB por archivo</p>
          <input type="file" accept=".pdf,.jpg,.jpeg" multiple onChange={handleFileChange} className="text-sm" />
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
          <button type="submit" disabled={saving} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition disabled:opacity-50">
            {saving ? 'Enviando...' : 'Enviar solicitud'}
          </button>
          <button type="button" onClick={() => router.push('/solicitudes')} className="text-gray-600 hover:text-gray-800 px-4 py-2.5">
            Cancelar
          </button>
        </div>
      </form>
    </AppShell>
  )
}
