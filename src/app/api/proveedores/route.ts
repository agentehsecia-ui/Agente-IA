import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const q = req.nextUrl.searchParams.get('q') || ''

  let query = supabase.from('proveedores').select('*').order('razon_social')
  if (q) {
    query = query.or(`nit.ilike.%${q}%,razon_social.ilike.%${q}%`)
  }

  const { data, error } = await query.limit(20)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()

  const { data: existing } = await supabase
    .from('proveedores')
    .select('id')
    .eq('nit', body.nit)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('proveedores')
      .update({
        razon_social: body.razon_social,
        banco: body.banco,
        tipo_cuenta: body.tipo_cuenta,
        numero_cuenta: body.numero_cuenta,
        contacto: body.contacto,
        email: body.email,
        telefono: body.telefono,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase
    .from('proveedores')
    .insert(body)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
