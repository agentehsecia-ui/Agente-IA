import { createServerClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()

  // Crear usuario
  if (body.accion === 'crear' || !body.accion) {
    const { email, password, nombre, rol } = body

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    const { data, error } = await supabase
      .from('perfiles')
      .insert({ id: authData.user.id, email, nombre, rol })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Cambiar contraseña
  if (body.accion === 'cambiar_password') {
    const { error } = await supabase.auth.admin.updateUserById(body.user_id, {
      password: body.password,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  // Cambiar rol
  if (body.accion === 'cambiar_rol') {
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: body.rol })
      .eq('id', body.user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Activar/desactivar usuario
  if (body.accion === 'toggle_activo') {
    const { error: dbError } = await supabase
      .from('perfiles')
      .update({ activo: body.activo })
      .eq('id', body.user_id)

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    // También banear/desbanear en auth
    await supabase.auth.admin.updateUserById(body.user_id, {
      ban_duration: body.activo ? 'none' : '876000h',
    })

    return NextResponse.json({ ok: true })
  }

  // Eliminar usuario
  if (body.accion === 'eliminar') {
    await supabase.from('perfiles').delete().eq('id', body.user_id)
    const { error } = await supabase.auth.admin.deleteUser(body.user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}
