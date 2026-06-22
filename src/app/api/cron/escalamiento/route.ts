import { createServerClient } from '@/lib/supabase'
import { sendEmail, emailEscalamiento } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServerClient()

  const { data: pendientes } = await supabase
    .from('solicitudes')
    .select('id, created_at, concepto')
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: true })

  if (!pendientes || pendientes.length === 0) {
    return NextResponse.json({ message: 'Sin pendientes' })
  }

  const now = Date.now()
  const masAntigua = pendientes[0]
  const horasSinAprobar = Math.floor((now - new Date(masAntigua.created_at).getTime()) / 3600000)

  // Solo enviar si cumple umbrales: 24, 48, 72, 96+
  if (horasSinAprobar < 24) {
    return NextResponse.json({ message: 'Aún no cumple umbral' })
  }

  const { data: gerentes } = await supabase
    .from('perfiles')
    .select('email')
    .eq('rol', 'gerencia')

  if (gerentes) {
    const { subject, html } = emailEscalamiento(pendientes.length, horasSinAprobar)
    for (const g of gerentes) {
      await sendEmail(g.email, subject, html)
    }
  }

  // Notificaciones in-app
  const { data: gerentesIds } = await supabase.from('perfiles').select('id').eq('rol', 'gerencia')
  if (gerentesIds) {
    const notifs = gerentesIds.map(g => ({
      usuario_id: g.id,
      titulo: `⚠️ ${pendientes.length} solicitudes sin aprobar`,
      mensaje: `La más antigua lleva ${horasSinAprobar}h sin gestión`,
      url: '/aprobaciones',
    }))
    await supabase.from('notificaciones').insert(notifs)
  }

  return NextResponse.json({ sent: true, pendientes: pendientes.length, horasSinAprobar })
}
