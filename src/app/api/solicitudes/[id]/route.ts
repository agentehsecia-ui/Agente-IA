import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*, proveedor:proveedores(*), perfil_creador:perfiles!solicitudes_creado_por_fkey(*)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Cargar beneficiarios
  const { data: beneficiarios } = await supabase
    .from('solicitud_beneficiarios')
    .select('*, proveedor:proveedores(*)')
    .eq('solicitud_id', params.id)

  // Cargar adjuntos
  const { data: adjuntos } = await supabase
    .from('adjuntos')
    .select('*')
    .eq('solicitud_id', params.id)

  return NextResponse.json({ ...data, beneficiarios: beneficiarios || [], adjuntos: adjuntos || [] })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const body = await req.json()

  // Solo permitir edición si está en aclaración
  const { data: current } = await supabase
    .from('solicitudes')
    .select('estado')
    .eq('id', params.id)
    .single()

  if (!current || current.estado !== 'aclaracion') {
    return NextResponse.json({ error: 'Solo se pueden editar solicitudes en aclaración' }, { status: 400 })
  }

  const updateData: any = {
    concepto: body.concepto,
    valor: body.valor,
    fecha_limite: body.fecha_limite,
    centro_costo: body.centro_costo,
    observaciones: body.observaciones,
    referencia_interna: body.referencia_interna,
    updated_at: new Date().toISOString(),
  }

  // Si viene proveedor_id, actualizarlo
  if (body.proveedor_id) updateData.proveedor_id = body.proveedor_id

  // Si reenvía (cambia estado a pendiente)
  if (body.reenviar) {
    updateData.estado = 'pendiente'
    updateData.observacion_aclaracion = null
  }

  const { data, error } = await supabase
    .from('solicitudes')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notificar a gerencia si se reenvía
  if (body.reenviar) {
    const { data: gerentes } = await supabase.from('perfiles').select('id').eq('rol', 'gerencia')
    if (gerentes) {
      const notifs = gerentes.map(g => ({
        usuario_id: g.id,
        titulo: 'Solicitud corregida y reenviada',
        mensaje: `${data.concepto}`,
        url: '/aprobaciones',
      }))
      await supabase.from('notificaciones').insert(notifs)
    }
  }

  return NextResponse.json(data)
}
