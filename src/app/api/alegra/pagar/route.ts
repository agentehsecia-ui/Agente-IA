import { createServerClient } from '@/lib/supabase'
import { aplicarPagoAlegra } from '@/lib/alegra'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { solicitud_id } = await req.json()

  const { data: sol } = await supabase
    .from('solicitudes')
    .select('*, proveedor:proveedores(*)')
    .eq('id', solicitud_id)
    .single()

  if (!sol) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  if (!sol.alegra_id) return NextResponse.json({ error: 'Solicitud no vinculada a Alegra' }, { status: 400 })
  if (sol.estado !== 'pagada' && sol.estado !== 'pagada_parcial') {
    return NextResponse.json({ error: 'La solicitud no está en estado pagado' }, { status: 400 })
  }

  try {
    const result = await aplicarPagoAlegra(
      sol.alegra_id,
      sol.valor_pagado || sol.valor,
      sol.fecha_pago || new Date().toISOString().slice(0, 10),
    )
    return NextResponse.json({ ok: true, alegra_payment: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
