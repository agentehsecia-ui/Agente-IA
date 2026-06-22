'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Perfil } from '@/lib/types'
import {
  LayoutDashboard, FileText, CheckCircle, CreditCard,
  Shield, Users, ClipboardList, Settings, LogOut
} from 'lucide-react'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface Props {
  perfil: Perfil
}

export default function Sidebar({ perfil }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const allLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['sostenibilidad', 'gerencia', 'admin'] },
    { href: '/solicitudes', label: 'Solicitudes', icon: FileText, roles: ['sostenibilidad', 'admin'] },
    { href: '/aprobaciones', label: 'Aprobaciones', icon: CheckCircle, roles: ['gerencia', 'admin'] },
    { href: '/pagos', label: 'Cola de Pagos', icon: CreditCard, roles: ['gerencia', 'admin'] },
    { href: '/seguridad-social', label: 'Seguridad Social', icon: Shield, roles: ['sostenibilidad', 'gerencia', 'admin'] },
    { href: '/nomina', label: 'Nómina', icon: Users, roles: ['sostenibilidad', 'gerencia', 'admin'] },
    { href: '/auditoria', label: 'Auditoría', icon: ClipboardList, roles: ['gerencia', 'admin'] },
    { href: '/admin', label: 'Administración', icon: Settings, roles: ['admin'] },
  ]

  const links = allLinks.filter(l => l.roles.includes(perfil.rol))

  async function handleLogout() {
    await signOut()
    router.push('/')
  }

  return (
    <aside className="w-64 bg-brand-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-brand-800">
        <h1 className="text-xl font-bold">SIGACP</h1>
        <p className="text-brand-300 text-xs mt-1">Control de Pagos</p>
      </div>

      <nav className="flex-1 py-4">
        {links.map(link => {
          const active = pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition ${
                active
                  ? 'bg-brand-700 text-white font-medium'
                  : 'text-brand-200 hover:bg-brand-800 hover:text-white'
              }`}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-brand-800">
        <div className="text-sm mb-3">
          <p className="font-medium">{perfil.nombre}</p>
          <p className="text-brand-300 text-xs capitalize">{perfil.rol}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-brand-300 hover:text-white text-sm transition"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
