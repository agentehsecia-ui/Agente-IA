import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const estado = req.nextUrl.searchParams.get('estado')
  const creado_por = req.nextUrl.searchParams.get('creado_por')

  let query = supabase
    .from('solicitudes')
    .select('*, proveedor:proveedores(*), perfil_creador:perfiles!solicitudes_creado_por_fkey(*)')
    .order('created_at', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (creado_por) query = query.eq('creado_por', creado_por)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('solicitudes')
    .insert({
      proveedor_id: body.proveedor_id,
      tipo_pago: body.tipo_pago,
      concepto: body.concepto,
      valor: body.valor,
      fecha_limite: body.fecha_limite,
      centro_costo: body.centro_costo,
      observaciones: body.observaciones,
      creado_por: body.creado_por,
      estado: 'pendiente',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notificar a gerencia
  const { data: gerentes } = await supabase
    .from('perfiles')
    .select('id')
    .eq('rol', 'gerencia')

  if (gerentes) {
    const notifs = gerentes.map(g => ({
      usuario_id: g.id,
      titulo: 'Nueva solicitud de pago',
      mensaje: `${body.concepto} - $${Number(body.valor).toLocaleString('es-CO')}`,
      url: `/aprobaciones`,
    }))
    await supabase.from('notificaciones').insert(notifs)
  }

  return NextResponse.json(data)
}
