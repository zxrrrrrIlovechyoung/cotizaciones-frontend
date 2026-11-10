import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'

import AppShell from '@/components/AppShell'

export default function ConfiguracionLayout() {
  const [revisionAlertas, setRevisionAlertas] = useState(0)
  const actualizarAlertas = useCallback(() => setRevisionAlertas((revision) => revision + 1), [])

  return (
    <AppShell mostrarBarraSuperior={false} revisionAlertas={revisionAlertas}>
      <Outlet context={actualizarAlertas} />
    </AppShell>
  )
}
