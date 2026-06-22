'use client'

import { useState, useEffect } from 'react'
import { Proveedor } from '@/lib/types'

interface Props {
  onSelect: (proveedor: Proveedor) => void
  selected: Proveedor | null
}

export default function ProveedorSearch({ onSelect, selected }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Proveedor[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newProv, setNewProv] = useState({
    nit: '', razon_social: '', banco: '', tipo_cuenta: '', numero_cuenta: '',
    contacto: '', email: '', telefono: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(() => {
      fetch(`/api/proveedores?q=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(setResults)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  async function handleCreateProv(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/proveedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProv),
    })
    const prov = await res.json()
    onSelect(prov)
    setShowNew(false)
    setSaving(false)
  }

  if (selected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{selected.razon_social}</p>
            <p className="text-xs text-gray-500">NIT: {selected.nit} | {selected.banco} {selected.numero_cuenta}</p>
          </div>
          <button onClick={() => { onSelect(null as any); setQuery('') }} className="text-xs text-blue-600 hover:underline">
            Cambiar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar por NIT o razón social..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
      />

      {results.length > 0 && (
        <div className="border rounded-lg max-h-40 overflow-y-auto">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setQuery(''); setResults([]) }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 text-sm"
            >
              <span className="font-medium">{p.razon_social}</span>
              <span className="text-gray-500 ml-2">NIT: {p.nit}</span>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !showNew && (
        <button
          onClick={() => { setShowNew(true); setNewProv(prev => ({ ...prev, nit: query })) }}
          className="text-sm text-brand-600 hover:underline"
        >
          + Crear nuevo proveedor
        </button>
      )}

      {showNew && (
        <form onSubmit={handleCreateProv} className="bg-gray-50 border rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Nuevo proveedor</p>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="NIT *" value={newProv.nit} onChange={e => setNewProv(p => ({ ...p, nit: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input required placeholder="Razón Social *" value={newProv.razon_social} onChange={e => setNewProv(p => ({ ...p, razon_social: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Banco" value={newProv.banco} onChange={e => setNewProv(p => ({ ...p, banco: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <select value={newProv.tipo_cuenta} onChange={e => setNewProv(p => ({ ...p, tipo_cuenta: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Tipo de cuenta</option>
              <option value="ahorros">Ahorros</option>
              <option value="corriente">Corriente</option>
            </select>
            <input placeholder="Número de cuenta" value={newProv.numero_cuenta} onChange={e => setNewProv(p => ({ ...p, numero_cuenta: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Contacto" value={newProv.contacto} onChange={e => setNewProv(p => ({ ...p, contacto: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Email" type="email" value={newProv.email} onChange={e => setNewProv(p => ({ ...p, email: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Teléfono" value={newProv.telefono} onChange={e => setNewProv(p => ({ ...p, telefono: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-brand-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar proveedor'}
            </button>
            <button type="button" onClick={() => setShowNew(false)} className="text-gray-500 text-sm hover:underline">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  )
}
