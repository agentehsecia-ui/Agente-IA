import { ESTADO_LABELS, ESTADO_COLORS } from '@/lib/format'

export default function Badge({ estado }: { estado: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[estado] || 'bg-gray-100 text-gray-800'}`}>
      {ESTADO_LABELS[estado] || estado}
    </span>
  )
}
