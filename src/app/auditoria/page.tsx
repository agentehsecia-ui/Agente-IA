'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/Badge'
import { Auditoria } from '@/lib/types'
import { formatDateTime } from '@/lib/format'
import { createBrowserClient } from '@/lib/supabase'

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<Auditoria[]>([])
  const [filtroTabla, setFiltroTabla] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient()
    let query = supabase
      .from('auditoria')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (filtroTabla) query = query.eq('tabla', filtroTabla)

    query.then(({ data }) => {
      setRegistros(data || [])
      setLoading(false)
    })
  }, [filtroTabla])

  const TABLA_LABELS: Record<string, string> = {
    solicitudes: 'Solicitudes',
    seguridad_social: 'Seguridad Social',
    nomina: 'Nómina',
  }

  return (
    <AppShell title="Auditoría" requiredRoles={['gerencia', 'admin']}>
      <div className="space-y-4">
        <div className="flex gap-2">
          {['', 'solicitudes', 'seguridad_social', 'nomina'].map(t => (
            <button
              key={t}
              onClick={() => setFiltroTabla(t)}
              className={`px-3 py-1.5 rounded-lg text-sm ${filtroTabla === t ? 'bg-brand-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              {t === '' ? 'Todas' : TABLA_LABELS[t] || t}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tabla</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acción</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado anterior</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado nuevo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Cargando...</td></tr>
              ) : registros.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin registros</td></tr>
              ) : (
                registros.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{r.usuario_nombre}</td>
                    <td className="px-4 py-3">{TABLA_LABELS[r.tabla] || r.tabla}</td>
                    <td className="px-4 py-3 capitalize">{r.accion}</td>
                    <td className="px-4 py-3">{r.estado_anterior ? <Badge estado={r.estado_anterior} /> : '-'}</td>
                    <td className="px-4 py-3">{r.estado_nuevo ? <Badge estado={r.estado_nuevo} /> : '-'}</td>
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
