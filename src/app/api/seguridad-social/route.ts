import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const estado = req.nextUrl.searchParams.get('estado')

  let query = supabase.from('seguridad_social').select('*').order('created_at', { ascending: false })
  if (estado) query = query.eq('estado', estado)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()

  if (body.accion === 'aprobar') {
    const { data, error } = await supabase
      .from('seguridad_social')
      .update({ estado: 'aprobada', aprobado_por: body.usuario_id, fecha_aprobacion: new Date().toISOString() })
      .eq('id', body.id)
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (body.accion === 'pagar') {
    const { data, error } = await supabase
      .from('seguridad_social')
      .update({ estado: 'pagada', fecha_pago: body.fecha_pago, numero_comprobante: body.numero_comprobante })
      .eq('id', body.id)
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('seguridad_social')
    .insert({
      tipo_planilla: body.tipo_planilla,
      numero_planilla: body.numero_planilla,
      periodo_mes: body.periodo_mes,
      periodo_anio: body.periodo_anio,
      valor: body.valor,
      fecha_limite: body.fecha_limite,
      observaciones: body.observaciones,
      creado_por: body.creado_por,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
