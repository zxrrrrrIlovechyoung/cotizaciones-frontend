import { useState, type ReactNode } from 'react'

import AppHeader from '@/components/AppHeader'
import AppTopBar from '@/components/AppTopBar'

interface AppShellProps {
  children: ReactNode
  onCrearCotizacion?: () => void
  mostrarCrearCotizacion?: boolean
  headerContextual?: ReactNode
  accionAntesPerfil?: ReactNode
  revisionAlertas?: number
  onIntentarCerrarSesion?: (cerrar: () => void) => void
  mostrarBarraSuperior?: boolean
}

export default function AppShell({ children, onCrearCotizacion, mostrarCrearCotizacion, headerContextual, accionAntesPerfil, revisionAlertas, onIntentarCerrarSesion, mostrarBarraSuperior = true }: AppShellProps) {
  const [sidebarPlegado, setSidebarPlegado] = useState(() => sessionStorage.getItem('cotizaciones.sidebarPlegado') === 'true')

  function alternarSidebar() {
    const plegado = !sidebarPlegado
    sessionStorage.setItem('cotizaciones.sidebarPlegado', String(plegado))
    setSidebarPlegado(plegado)
  }

  return (
    <div className={sidebarPlegado ? 'page page--sidebar-plegado' : 'page'}>
      <AppTopBar plegado={sidebarPlegado} onAlternar={alternarSidebar} revisionAlertas={revisionAlertas} />
      <main className={mostrarBarraSuperior ? 'page__main' : 'page__main page__main--sin-barra'}>
        {mostrarBarraSuperior && <AppHeader onCrearCotizacion={onCrearCotizacion} mostrarCrearCotizacion={mostrarCrearCotizacion} contextual={headerContextual} accionAntesPerfil={accionAntesPerfil} onIntentarCerrarSesion={onIntentarCerrarSesion} />}
        {children}
      </main>
    </div>
  )
}
