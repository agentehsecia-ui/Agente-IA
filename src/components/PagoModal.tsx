'use client'

import { useState } from 'react'

interface Props {
  titulo: string
  onSubmit: (fecha_pago: string, numero_comprobante: string) => void
  onCancel: () => void
}

export default function PagoModal({ titulo, onSubmit, onCancel }: Props) {
  const [fecha, setFecha] = useState('')
  const [comprobante, setComprobante] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(fecha, comprobante)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
        <h3 className="font-semibold">{titulo}</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de pago *</label>
          <input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de comprobante *</label>
          <input type="text" required value={comprobante} onChange={e => setComprobante(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ej: 001234" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Registrar pago</button>
          <button type="button" onClick={onCancel} className="text-gray-500 text-sm">Cancelar</button>
        </div>
      </form>
    </div>
  )
}
