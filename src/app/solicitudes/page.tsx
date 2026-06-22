'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Solicitud } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/format'
import { Plus } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'

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

  return (
    <AppShell title="Solicitudes de Pago" requiredRoles={['sostenibilidad', 'admin']}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
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
          <Link
            href="/solicitudes/nueva"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Plus size={16} /> Nueva solicitud
          </Link>
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : solicitudes.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No hay solicitudes</td></tr>
              ) : (
                solicitudes.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{s.numero}</td>
                    <td className="px-4 py-3 font-medium">{s.proveedor?.razon_social}</td>
                    <td className="px-4 py-3 text-gray-600">{s.concepto}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.valor)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(s.fecha_limite)}</td>
                    <td className="px-4 py-3"><Badge estado={s.estado} /></td>
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
