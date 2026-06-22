import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return

  await resend.emails.send({
    from: 'SIGACP <notificaciones@tudominio.com>',
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin:0;">SIGACP</h2>
          <p style="margin:4px 0 0; opacity:0.8; font-size:14px;">Sistema de Gestión y Control de Pagos</p>
        </div>
        <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          ${html}
        </div>
      </div>
    `,
  })
}

export function emailNuevaSolicitud(concepto: string, valor: string, proveedor: string) {
  return {
    subject: `Nueva solicitud de pago - ${proveedor}`,
    html: `
      <h3 style="color:#1e40af;">Nueva solicitud de pago</h3>
      <p><strong>Proveedor:</strong> ${proveedor}</p>
      <p><strong>Concepto:</strong> ${concepto}</p>
      <p><strong>Valor:</strong> ${valor}</p>
      <p style="margin-top:16px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/aprobaciones" style="background:#2563eb; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
          Revisar solicitud
        </a>
      </p>
    `,
  }
}

export function emailAprobacion(concepto: string, proveedor: string, aprobada: boolean) {
  return {
    subject: `Solicitud ${aprobada ? 'aprobada' : 'rechazada'} - ${proveedor}`,
    html: `
      <h3 style="color:${aprobada ? '#16a34a' : '#dc2626'};">Solicitud ${aprobada ? 'aprobada' : 'rechazada'}</h3>
      <p><strong>Proveedor:</strong> ${proveedor}</p>
      <p><strong>Concepto:</strong> ${concepto}</p>
      <p style="margin-top:16px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/solicitudes" style="background:#2563eb; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
          Ver detalle
        </a>
      </p>
    `,
  }
}

export function emailEscalamiento(pendientes: number, horasSinAprobar: number) {
  const urgencia = horasSinAprobar >= 96 ? 'CRÍTICA' : horasSinAprobar >= 72 ? 'PRIORITARIA' : 'RECORDATORIO'
  return {
    subject: `[${urgencia}] ${pendientes} solicitudes pendientes de aprobación`,
    html: `
      <h3 style="color:${horasSinAprobar >= 72 ? '#dc2626' : '#f59e0b'};">⚠️ Alerta ${urgencia}</h3>
      <p>Tiene <strong>${pendientes}</strong> solicitudes sin aprobar.</p>
      <p>La más antigua lleva <strong>${horasSinAprobar} horas</strong> sin gestión.</p>
      <p style="margin-top:16px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/aprobaciones" style="background:#dc2626; color:white; padding:10px 20px; border-radius:6px; text-decoration:none; display:inline-block;">
          Ir a aprobaciones
        </a>
      </p>
    `,
  }
}
