import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('razon_social')
    .limit(500)

  if (error) {
    console.error('GET proveedores error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!body.nit || !body.razon_social) {
    return NextResponse.json({ error: 'NIT y Razón Social son obligatorios' }, { status: 400 })
  }

  // Verificar si ya existe
  const { data: existing } = await supabase
    .from('proveedores')
    .select('*')
    .eq('nit', body.nit)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from('proveedores')
      .update({
        razon_social: body.razon_social,
        banco: body.banco || null,
        tipo_cuenta: body.tipo_cuenta || null,
        numero_cuenta: body.numero_cuenta || null,
        contacto: body.contacto || null,
        email: body.email || null,
        telefono: body.telefono || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('UPDATE proveedor error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('proveedores')
    .insert({
      nit: body.nit,
      razon_social: body.razon_social,
      banco: body.banco || null,
      tipo_cuenta: body.tipo_cuenta || null,
      numero_cuenta: body.numero_cuenta || null,
      contacto: body.contacto || null,
      email: body.email || null,
      telefono: body.telefono || null,
    })
    .select()
    .single()

  if (error) {
    console.error('INSERT proveedor error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
