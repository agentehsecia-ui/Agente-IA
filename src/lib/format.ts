export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const ESTADO_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  aclaracion: 'En aclaración',
  pagada: 'Pagada',
  pagada_parcial: 'Pago parcial',
}

export const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobada: 'bg-blue-100 text-blue-800',
  rechazada: 'bg-red-100 text-red-800',
  aclaracion: 'bg-orange-100 text-orange-800',
  pagada: 'bg-green-100 text-green-800',
  pagada_parcial: 'bg-emerald-100 text-emerald-800',
}

export const TIPO_PAGO_LABELS: Record<string, string> = {
  proveedor: 'Proveedor',
  hotel: 'Hotel',
  transporte: 'Transporte',
  honorarios: 'Honorarios',
  tecnologia: 'Tecnología',
  eventos: 'Eventos',
  seguridad_social: 'Seguridad Social',
  nomina: 'Nómina',
  otro: 'Otro',
}
