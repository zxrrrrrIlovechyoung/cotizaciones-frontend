import type { ReactNode } from 'react'

import AppHeader from '@/components/AppHeader'
import AppTopBar from '@/components/AppTopBar'

interface AppShellProps {
  children: ReactNode
  onCrearCotizacion?: () => void
}

export default function AppShell({ children, onCrearCotizacion }: AppShellProps) {
  return (
    <div className="page">
      <AppTopBar />
      <main className="page__main">
        <AppHeader onCrearCotizacion={onCrearCotizacion} />
        {children}
      </main>
    </div>
  )
}
