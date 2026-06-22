'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { Proveedor } from '@/lib/types'
import { Upload, Edit3, Download } from 'lucide-react'

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []

  // Parse header
  const headers = parseCSVLine(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((h, j) => { row[h.trim()] = (values[j] || '').trim() })
    rows.push(row)
  }
  return rows
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else { inQuotes = !inQuotes }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function buildNombreCompleto(row: Record<string, string>): string {
  const parts = [
    row['Nombre'],
    row['Segundo nombre'],
    row['Primer apellido'],
    row['Segundo apellido'],
  ].filter(p => p && p.trim())
  return parts.join(' ').trim()
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)
  const [editProv, setEditProv] = useState<Proveedor | null>(null)
  const [editForm, setEditForm] = useState({ banco: '', tipo_cuenta: '', numero_cuenta: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [search, setSearch] = useState('')

  async function load() {
    const res = await fetch('/api/proveedores')
    const data = await res.json()
    if (Array.isArray(data)) setProveedores(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportResult(null)

    const text = await file.text()
    const rows = parseCSV(text)

    const mapped = rows
      .filter(r => r['Identificación'])
      .map(r => ({
        nit: r['Identificación'],
        razon_social: buildNombreCompleto(r),
        contacto: r['Celular'] || r['Teléfono 1'] || null,
        email: r['Correo'] || null,
        telefono: r['Celular'] || r['Teléfono 1'] || null,
      }))
      .filter(p => p.razon_social)

    const res = await fetch('/api/proveedores/importar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proveedores: mapped }),
    })
    const result = await res.json()
    setImportResult(result)
    setImporting(false)
    load()

    // Reset file input
    e.target.value = ''
  }

  async function handleSaveBank(e: React.FormEvent) {
    e.preventDefault()
    if (!editProv) return
    setSavingEdit(true)

    await fetch('/api/proveedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nit: editProv.nit,
        razon_social: editProv.razon_social,
        banco: editForm.banco,
        tipo_cuenta: editForm.tipo_cuenta,
        numero_cuenta: editForm.numero_cuenta,
      }),
    })

    setEditProv(null)
    setSavingEdit(false)
    load()
  }

  function handleExport() {
    let csv = '﻿'
    const headers = ['NIT', 'Razón Social', 'Banco', 'Tipo Cuenta', 'N° Cuenta', 'Contacto', 'Email', 'Teléfono']
    csv += headers.join('\t') + '\n'
    proveedores.forEach(p => {
      csv += [p.nit, p.razon_social, p.banco || '', p.tipo_cuenta || '', p.numero_cuenta || '', p.contacto || '', p.email || '', p.telefono || '']
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join('\t') + '\n'
    })
    const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proveedores_${new Date().toISOString().slice(0, 10)}.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = search
    ? proveedores.filter(p =>
        p.razon_social.toLowerCase().includes(search.toLowerCase()) ||
        p.nit.includes(search)
      )
    : proveedores

  return (
    <AppShell title="Proveedores / Terceros">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar por nombre o NIT..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg text-sm w-72"
            />
            <span className="text-sm text-gray-500">{filtered.length} registros</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Download size={16} /> Exportar
            </button>
            <label className={`flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${importing ? 'opacity-50' : ''}`}>
              <Upload size={16} /> {importing ? 'Importando...' : 'Importar CSV'}
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={importing} />
            </label>
          </div>
        </div>

        {importResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
            <p className="font-medium text-green-800">Importación completada</p>
            <p className="text-green-700">
              {importResult.importados} nuevos · {importResult.actualizados} actualizados · {importResult.errores} errores · {importResult.total} total
            </p>
          </div>
        )}

        {/* Modal editar datos bancarios */}
        {editProv && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <form onSubmit={handleSaveBank} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
              <h3 className="font-semibold">Editar datos bancarios</h3>
              <p className="text-sm text-gray-500">{editProv.razon_social} — NIT: {editProv.nit}</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                <input value={editForm.banco} onChange={e => setEditForm(f => ({ ...f, banco: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: Bancolombia" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cuenta</label>
                <select value={editForm.tipo_cuenta} onChange={e => setEditForm(f => ({ ...f, tipo_cuenta: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Seleccione</option>
                  <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
                  <option value="Cuenta Corriente">Cuenta Corriente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de cuenta</label>
                <input value={editForm.numero_cuenta} onChange={e => setEditForm(f => ({ ...f, numero_cuenta: e.target.value }))} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: 96668189242" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={savingEdit} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {savingEdit ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setEditProv(null)} className="text-gray-500 text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">NIT/CC</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre / Razón Social</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Banco</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cuenta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contacto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay proveedores. Importa un CSV para comenzar.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{p.nit}</td>
                    <td className="px-4 py-3 font-medium">{p.razon_social}</td>
                    <td className="px-4 py-3 text-gray-600">{p.banco || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.numero_cuenta ? (
                        <span>{p.tipo_cuenta} {p.numero_cuenta}</span>
                      ) : (
                        <span className="text-orange-500 text-xs">Sin datos bancarios</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.email && <div>{p.email}</div>}
                      {p.telefono && <div>{p.telefono}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setEditProv(p); setEditForm({ banco: p.banco || '', tipo_cuenta: p.tipo_cuenta || '', numero_cuenta: p.numero_cuenta || '' }) }}
                        title="Editar datos bancarios"
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                      >
                        <Edit3 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  )
}
