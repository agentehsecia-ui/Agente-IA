'use client'

import { useState, useEffect } from 'react'
import { Proveedor } from '@/lib/types'

interface Props {
  onSelect: (proveedor: Proveedor) => void
  selected: Proveedor | null
}

export default function ProveedorSearch({ onSelect, selected }: Props) {
  const [query, setQuery] = useState('')
  const [allProveedores, setAllProveedores] = useState<Proveedor[]>([])
  const [results, setResults] = useState<Proveedor[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newProv, setNewProv] = useState({
    nit: '', razon_social: '', banco: '', tipo_cuenta: '', numero_cuenta: '',
    contacto: '', email: '', telefono: '',
  })
  const [saving, setSaving] = useState(false)

  // Cargar todos los proveedores al montar
  useEffect(() => {
    fetch('/api/proveedores')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllProveedores(data) })
  }, [])

  // Filtrar localmente al escribir
  useEffect(() => {
    if (!query.trim()) {
      setResults(allProveedores)
      return
    }
    const q = query.toLowerCase()
    const filtered = allProveedores.filter(p =>
      p.razon_social.toLowerCase().includes(q) ||
      p.nit.toLowerCase().includes(q) ||
      (p.numero_cuenta && p.numero_cuenta.includes(q))
    )
    setResults(filtered)
  }, [query, allProveedores])

  async function handleCreateProv(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/proveedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProv),
    })
    const prov = await res.json()
    if (prov.id) {
      setAllProveedores(prev => [...prev, prov])
      onSelect(prov)
      setShowNew(false)
      setNewProv({ nit: '', razon_social: '', banco: '', tipo_cuenta: '', numero_cuenta: '', contacto: '', email: '', telefono: '' })
    }
    setSaving(false)
  }

  if (selected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">{selected.razon_social}</p>
            <p className="text-xs text-gray-500">
              NIT/CC: {selected.nit}
              {selected.banco && ` | ${selected.banco}`}
              {selected.tipo_cuenta && ` - ${selected.tipo_cuenta}`}
              {selected.numero_cuenta && ` ${selected.numero_cuenta}`}
            </p>
          </div>
          <button onClick={() => { onSelect(null as any); setQuery(''); setShowDropdown(false) }} className="text-xs text-blue-600 hover:underline">
            Cambiar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setShowDropdown(true); setShowNew(false) }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Buscar por nombre, NIT, cédula o número de cuenta..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
      />

      {showDropdown && !showNew && (
        <div className="border rounded-lg max-h-48 overflow-y-auto bg-white shadow-lg z-10 absolute w-full">
          {results.length > 0 ? (
            results.map(p => (
              <button
                key={p.id}
                onClick={() => { onSelect(p); setQuery(''); setShowDropdown(false) }}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b last:border-b-0 text-sm"
              >
                <div className="font-medium">{p.razon_social}</div>
                <div className="text-xs text-gray-500">
                  NIT/CC: {p.nit}
                  {p.banco && ` | ${p.banco}`}
                  {p.numero_cuenta && ` - ${p.numero_cuenta}`}
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">No se encontraron resultados</div>
          )}
          <button
            onClick={() => { setShowNew(true); setShowDropdown(false) }}
            className="w-full text-left px-4 py-2.5 text-brand-600 hover:bg-blue-50 border-t text-sm font-medium"
          >
            + Crear nuevo proveedor / tercero
          </button>
        </div>
      )}

      {showNew && (
        <form onSubmit={handleCreateProv} className="bg-gray-50 border rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Nuevo proveedor / tercero</p>
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="NIT o Cédula *" value={newProv.nit} onChange={e => setNewProv(p => ({ ...p, nit: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input required placeholder="Nombre o Razón Social *" value={newProv.razon_social} onChange={e => setNewProv(p => ({ ...p, razon_social: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Banco" value={newProv.banco} onChange={e => setNewProv(p => ({ ...p, banco: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <select value={newProv.tipo_cuenta} onChange={e => setNewProv(p => ({ ...p, tipo_cuenta: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm">
              <option value="">Tipo de cuenta</option>
              <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
              <option value="Cuenta Corriente">Cuenta Corriente</option>
            </select>
            <input placeholder="Número de cuenta" value={newProv.numero_cuenta} onChange={e => setNewProv(p => ({ ...p, numero_cuenta: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Contacto" value={newProv.contacto} onChange={e => setNewProv(p => ({ ...p, contacto: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Email" type="email" value={newProv.email} onChange={e => setNewProv(p => ({ ...p, email: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
            <input placeholder="Teléfono" value={newProv.telefono} onChange={e => setNewProv(p => ({ ...p, telefono: e.target.value }))} className="px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-brand-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-brand-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setShowNew(false)} className="text-gray-500 text-sm hover:underline">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  )
}
