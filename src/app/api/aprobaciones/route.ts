import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { solicitud_id, accion, observacion, usuario_id } = body

  const updateData: any = { updated_at: new Date().toISOString() }

  if (accion === 'aprobar') {
    updateData.estado = 'aprobada'
    updateData.aprobado_por = usuario_id
    updateData.fecha_aprobacion = new Date().toISOString()
    updateData.observacion_aprobacion = observacion
  } else if (accion === 'rechazar') {
    updateData.estado = 'rechazada'
    updateData.aprobado_por = usuario_id
    updateData.fecha_aprobacion = new Date().toISOString()
    updateData.observacion_aprobacion = observacion
  } else if (accion === 'aclaracion') {
    updateData.estado = 'aclaracion'
    updateData.observacion_aclaracion = observacion
  }

  const { data: solicitud, error } = await supabase
    .from('solicitudes')
    .update(updateData)
    .eq('id', solicitud_id)
    .select('*, proveedor:proveedores(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notificar al creador
  const accionLabel = accion === 'aprobar' ? 'aprobada' : accion === 'rechazar' ? 'rechazada' : 'requiere aclaración'
  await supabase.from('notificaciones').insert({
    usuario_id: solicitud.creado_por,
    titulo: `Solicitud ${accionLabel}`,
    mensaje: `${solicitud.concepto} - ${solicitud.proveedor?.razon_social || ''}`,
    url: '/solicitudes',
  })

  return NextResponse.json(solicitud)
}
