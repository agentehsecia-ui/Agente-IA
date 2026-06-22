import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { solicitud_id, fecha_pago, numero_comprobante, es_parcial, valor_pagado, nota_parcial } = body

  const updateData: any = {
    fecha_pago,
    numero_comprobante,
    updated_at: new Date().toISOString(),
  }

  if (es_parcial) {
    updateData.estado = 'pagada_parcial'
    updateData.valor_pagado = valor_pagado
    updateData.nota_pago_parcial = nota_parcial
  } else {
    updateData.estado = 'pagada'
    // valor_pagado se iguala al valor total
    const { data: sol } = await supabase.from('solicitudes').select('valor').eq('id', solicitud_id).single()
    if (sol) updateData.valor_pagado = sol.valor
  }

  const { data, error } = await supabase
    .from('solicitudes')
    .update(updateData)
    .eq('id', solicitud_id)
    .select('*, proveedor:proveedores(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notificar al creador
  await supabase.from('notificaciones').insert({
    usuario_id: data.creado_por,
    titulo: es_parcial ? 'Pago parcial registrado' : 'Pago registrado',
    mensaje: `${data.concepto} - ${data.proveedor?.razon_social || ''}`,
    url: '/solicitudes',
  })

  return NextResponse.json(data)
}
