import type { ReactNode } from 'react'

import AppHeader from '@/components/AppHeader'
import AppTopBar from '@/components/AppTopBar'

interface AppShellProps {
  children: ReactNode
  onCrearCotizacion?: () => void
  mostrarCrearCotizacion?: boolean
  headerContextual?: ReactNode
  accionAntesPerfil?: ReactNode
}

export default function AppShell({ children, onCrearCotizacion, mostrarCrearCotizacion, headerContextual, accionAntesPerfil }: AppShellProps) {
  return (
    <div className="page">
      <AppTopBar />
      <main className="page__main">
        <AppHeader onCrearCotizacion={onCrearCotizacion} mostrarCrearCotizacion={mostrarCrearCotizacion} contextual={headerContextual} accionAntesPerfil={accionAntesPerfil} />
        {children}
      </main>
    </div>
  )
}
