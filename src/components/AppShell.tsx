'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getPerfil } from '@/lib/auth'
import { Perfil } from '@/lib/types'
import Sidebar from './Sidebar'
import Header from './Header'

interface Props {
  children: React.ReactNode
  title: string
  requiredRoles?: string[]
}

export default function AppShell({ children, title, requiredRoles }: Props) {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getPerfil().then(p => {
      if (!p) {
        router.push('/')
        return
      }
      if (requiredRoles && !requiredRoles.includes(p.rol)) {
        router.push('/dashboard')
        return
      }
      setPerfil(p)
      setLoading(false)
    })
  }, [])

  if (loading || !perfil) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar perfil={perfil} />
      <div className="flex-1 flex flex-col">
        <Header title={title} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
