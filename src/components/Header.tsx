'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'
import { Notificacion } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

export default function Header({ title }: { title: string }) {
  const [notifs, setNotifs] = useState<Notificacion[]>([])
  const [open, setOpen] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    supabase
      .from('notificaciones')
      .select('*')
      .eq('leida', false)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setNotifs(data || []))
  }, [])

  async function markRead(id: string) {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  return (
    <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>

      <div className="relative">
        <button onClick={() => setOpen(!open)} className="relative p-2 hover:bg-gray-100 rounded-lg">
          <Bell size={20} className="text-gray-600" />
          {notifs.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {notifs.length}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border z-50 max-h-96 overflow-y-auto">
            <div className="p-3 border-b font-medium text-sm text-gray-700">Notificaciones</div>
            {notifs.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">Sin notificaciones nuevas</div>
            ) : (
              notifs.map(n => (
                <div key={n.id} className="p-3 border-b hover:bg-gray-50 cursor-pointer" onClick={() => markRead(n.id)}>
                  <p className="text-sm font-medium text-gray-800">{n.titulo}</p>
                  <p className="text-xs text-gray-500 mt-1">{n.mensaje}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </header>
  )
}
