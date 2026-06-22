'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Solicitud } from '@/lib/types'
import { formatCurrency, formatDate, TIPO_PAGO_LABELS, ESTADO_LABELS } from '@/lib/format'
import { Plus, MessageCircle, Download, Edit3 } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'

function generateWhatsAppText(s: Solicitud): string {
  const lines = [
    `👤 Beneficiario: ${s.proveedor?.razon_social || ''}`,
    `🪪 Documento: ${s.proveedor?.nit || ''}`,
    `📋 Concepto: ${s.concepto}`,
    `💰 Valor: ${formatCurrency(s.valor)}`,
  ]
  if (s.proveedor?.banco || s.proveedor?.tipo_cuenta) {
    lines.push(`🏦 Banco: ${s.proveedor?.banco || ''} – ${s.proveedor?.tipo_cuenta || ''}`)
  }
  if (s.proveedor?.numero_cuenta) {
    lines.push(`🔢 N° de cuenta: ${s.proveedor.numero_cuenta}`)
  }
  if (s.referencia_interna) {
    lines.push(`      Ref Interna: ${s.referencia_interna}`)
  }
  return lines.join('\n')
}

function exportToExcel(solicitudes: Solicitud[]) {
  const headers = ['#', 'Fecha', 'Proveedor', 'NIT', 'Concepto', 'Tipo Pago', 'Valor', 'Fecha Límite', 'Estado', 'Centro Costo', 'Banco', 'Tipo Cuenta', 'N° Cuenta', 'Ref Interna', 'Observaciones']
  const rows = solicitudes.map(s => [
    s.numero,
    s.fecha_solicitud,
    s.proveedor?.razon_social || '',
    s.proveedor?.nit || '',
    s.concepto,
    TIPO_PAGO_LABELS[s.tipo_pago] || s.tipo_pago,
    s.valor,
    s.fecha_limite,
    ESTADO_LABELS[s.estado] || s.estado,
    s.centro_costo || '',
    s.proveedor?.banco || '',
    s.proveedor?.tipo_cuenta || '',
    s.proveedor?.numero_cuenta || '',
    s.referencia_interna || '',
    s.observaciones || '',
  ])

  let csv = '﻿' // BOM for Excel UTF-8
  csv += headers.join('\t') + '\n'
  rows.forEach(row => {
    csv += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join('\t') + '\n'
  })

  const blob = new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `solicitudes_${new Date().toISOString().slice(0, 10)}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [filtro, setFiltro] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const params = new URLSearchParams()
      const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', session.user.id).single()
      if (perfil?.rol === 'sostenibilidad') params.set('creado_por', session.user.id)
      if (filtro) params.set('estado', filtro)

      const res = await fetch(`/api/solicitudes?${params}`)
      setSolicitudes(await res.json())
      setLoading(false)
    }
    load()
  }, [filtro])

  function handleWhatsApp(s: Solicitud) {
    const text = generateWhatsAppText(s)
    navigator.clipboard.writeText(text)
    alert('Texto copiado al portapapeles. Pégalo en WhatsApp.')
  }

  return (
    <AppShell title="Solicitudes de Pago" requiredRoles={['sostenibilidad', 'admin']}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {['', 'pendiente', 'aprobada', 'aclaracion', 'pagada', 'rechazada'].map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${filtro === f ? 'bg-brand-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
              >
                {f === '' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportToExcel(solicitudes)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Download size={16} /> Exportar Excel
            </button>
            <Link
              href="/solicitudes/nueva"
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <Plus size={16} /> Nueva solicitud
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Proveedor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Concepto</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha límite</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : solicitudes.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hay solicitudes</td></tr>
              ) : (
                solicitudes.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{s.numero}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.proveedor?.razon_social}</div>
                      <div className="text-xs text-gray-400">{s.proveedor?.nit}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.concepto}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.valor)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(s.fecha_limite)}</td>
                    <td className="px-4 py-3"><Badge estado={s.estado} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {s.estado === 'aclaracion' && (
                          <a
                            href={`/solicitudes/${s.id}/editar`}
                            title="Editar y corregir"
                            className="p-1.5 hover:bg-orange-50 rounded text-orange-600"
                          >
                            <Edit3 size={16} />
                          </a>
                        )}
                        <button
                          onClick={() => handleWhatsApp(s)}
                          title="Copiar para WhatsApp"
                          className="p-1.5 hover:bg-green-50 rounded text-green-600"
                        >
                          <MessageCircle size={16} />
                        </button>
                      </div>
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
