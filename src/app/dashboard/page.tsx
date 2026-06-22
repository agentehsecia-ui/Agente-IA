'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/format'
import { Solicitud, SeguridadSocial, Nomina } from '@/lib/types'
import { FileText, CheckCircle, CreditCard, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface Stats {
  totalSolicitado: number
  totalAprobado: number
  totalPagado: number
  totalPendiente: number
  totalRechazado: number
  pendientes: number
  urgentes: number
  vencidas: number
  porCategoria: Record<string, number>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [proximosVencer, setProximosVencer] = useState<Solicitud[]>([])

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/solicitudes')
      const solicitudes: Solicitud[] = await res.json()

      const now = new Date()
      const s: Stats = {
        totalSolicitado: solicitudes.reduce((s, r) => s + r.valor, 0),
        totalAprobado: solicitudes.filter(r => ['aprobada', 'pagada', 'pagada_parcial'].includes(r.estado)).reduce((s, r) => s + r.valor, 0),
        totalPagado: solicitudes.filter(r => ['pagada', 'pagada_parcial'].includes(r.estado)).reduce((s, r) => s + (r.valor_pagado || 0), 0),
        totalPendiente: solicitudes.filter(r => r.estado === 'pendiente').reduce((s, r) => s + r.valor, 0),
        totalRechazado: solicitudes.filter(r => r.estado === 'rechazada').reduce((s, r) => s + r.valor, 0),
        pendientes: solicitudes.filter(r => r.estado === 'pendiente').length,
        urgentes: solicitudes.filter(r => {
          const d = Math.ceil((new Date(r.fecha_limite).getTime() - now.getTime()) / 86400000)
          return r.estado === 'pendiente' && d <= 3 && d >= 0
        }).length,
        vencidas: solicitudes.filter(r => r.estado === 'pendiente' && new Date(r.fecha_limite) < now).length,
        porCategoria: {},
      }

      solicitudes.forEach(r => {
        s.porCategoria[r.tipo_pago] = (s.porCategoria[r.tipo_pago] || 0) + r.valor
      })

      setStats(s)

      setProximosVencer(
        solicitudes
          .filter(r => ['pendiente', 'aprobada'].includes(r.estado))
          .sort((a, b) => new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime())
          .slice(0, 5)
      )
    }
    load()
  }, [])

  if (!stats) {
    return <AppShell title="Dashboard"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div></AppShell>
  }

  const TIPO_LABELS: Record<string, string> = {
    proveedor: 'Proveedores', hotel: 'Hoteles', transporte: 'Transporte',
    honorarios: 'Honorarios', tecnologia: 'Tecnología', eventos: 'Eventos',
    seguridad_social: 'Seg. Social', nomina: 'Nómina', otro: 'Otros',
  }

  return (
    <AppShell title="Dashboard Ejecutivo">
      <div className="space-y-6">
        {/* KPIs principales */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="text-blue-500" size={20} />
              <p className="text-sm text-gray-500">Total solicitado</p>
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats.totalSolicitado)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-blue-500" size={20} />
              <p className="text-sm text-gray-500">Aprobado</p>
            </div>
            <p className="text-xl font-bold">{formatCurrency(stats.totalAprobado)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="text-green-500" size={20} />
              <p className="text-sm text-gray-500">Pagado</p>
            </div>
            <p className="text-xl font-bold text-green-700">{formatCurrency(stats.totalPagado)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-yellow-500" size={20} />
              <p className="text-sm text-gray-500">Pendiente</p>
            </div>
            <p className="text-xl font-bold text-yellow-700">{formatCurrency(stats.totalPendiente)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="text-red-500" size={20} />
              <p className="text-sm text-gray-500">Rechazado</p>
            </div>
            <p className="text-xl font-bold text-red-700">{formatCurrency(stats.totalRechazado)}</p>
          </div>
        </div>

        {/* Alertas + próximos a vencer */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">Alertas</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pendientes de aprobación</span>
                <span className="font-bold text-yellow-600">{stats.pendientes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Urgentes (≤3 días)</span>
                <span className="font-bold text-orange-600">{stats.urgentes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Vencidas</span>
                <span className="font-bold text-red-600">{stats.vencidas}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Próximos a vencer</h3>
            {proximosVencer.length === 0 ? (
              <p className="text-sm text-gray-400">Sin pagos próximos</p>
            ) : (
              proximosVencer.map(s => (
                <div key={s.id} className="flex justify-between text-sm border-b pb-2">
                  <div>
                    <p className="font-medium">{s.proveedor?.razon_social}</p>
                    <p className="text-xs text-gray-400">{s.fecha_limite}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(s.valor)}</p>
                </div>
              ))
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-3">
            <h3 className="font-semibold text-gray-800">Por categoría</h3>
            {Object.entries(stats.porCategoria)
              .sort(([, a], [, b]) => b - a)
              .map(([tipo, valor]) => (
                <div key={tipo} className="flex justify-between text-sm">
                  <span className="text-gray-600">{TIPO_LABELS[tipo] || tipo}</span>
                  <span className="font-medium">{formatCurrency(valor)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
