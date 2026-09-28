import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { useAuth } from './stores/auth'
import ClientesView from './views/ClientesView'
import ConfiguracionView from './views/ConfiguracionView'
import CotizacionesView from './views/CotizacionesView'
import LoginView from './views/LoginView'
import MiCuentaView from './views/MiCuentaView'

function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />

  return children
}

export default function App() {
  const { token } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/cotizaciones" replace />} />
      <Route
        path="/login"
        element={token ? <Navigate to="/cotizaciones" replace /> : <LoginView />}
      />
      <Route
        path="/cotizaciones"
        element={
          <RequireAuth>
            <CotizacionesView />
          </RequireAuth>
        }
      />
      <Route
        path="/clientes"
        element={
          <RequireAuth>
            <ClientesView />
          </RequireAuth>
        }
      />
      <Route
        path="/configuracion"
        element={
          <RequireAuth>
            <ConfiguracionView />
          </RequireAuth>
        }
      />
      <Route
        path="/mi-cuenta"
        element={
          <RequireAuth>
            <MiCuentaView />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/cotizaciones" replace />} />
    </Routes>
  )
}
