import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const estado = req.nextUrl.searchParams.get('estado')

  let query = supabase.from('nomina').select('*').order('created_at', { ascending: false })
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
      .from('nomina')
      .update({ estado: 'aprobada', aprobado_por: body.usuario_id, fecha_aprobacion: new Date().toISOString() })
      .eq('id', body.id)
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (body.accion === 'pagar') {
    const { data, error } = await supabase
      .from('nomina')
      .update({ estado: 'pagada', fecha_pago: body.fecha_pago, numero_comprobante: body.numero_comprobante })
      .eq('id', body.id)
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('nomina')
    .insert({
      periodo: body.periodo,
      tipo_nomina: body.tipo_nomina,
      valor_total: body.valor_total,
      cantidad_colaboradores: body.cantidad_colaboradores,
      fecha_limite: body.fecha_limite,
      observaciones: body.observaciones,
      creado_por: body.creado_por,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
