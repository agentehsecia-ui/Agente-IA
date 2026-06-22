import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { proveedores } = await req.json()

  if (!Array.isArray(proveedores) || proveedores.length === 0) {
    return NextResponse.json({ error: 'No hay datos para importar' }, { status: 400 })
  }

  let importados = 0
  let actualizados = 0
  let errores = 0

  for (const p of proveedores) {
    if (!p.nit || !p.razon_social) { errores++; continue }

    const { data: existing } = await supabase
      .from('proveedores')
      .select('id')
      .eq('nit', p.nit)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('proveedores')
        .update({
          razon_social: p.razon_social,
          contacto: p.contacto || null,
          email: p.email || null,
          telefono: p.telefono || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
      actualizados++
    } else {
      const { error } = await supabase
        .from('proveedores')
        .insert({
          nit: p.nit,
          razon_social: p.razon_social,
          contacto: p.contacto || null,
          email: p.email || null,
          telefono: p.telefono || null,
          banco: null,
          tipo_cuenta: null,
          numero_cuenta: null,
        })
      if (error) {
        console.error('Import error:', p.nit, error.message)
        errores++
      } else {
        importados++
      }
    }
  }

  return NextResponse.json({ importados, actualizados, errores, total: proveedores.length })
}
