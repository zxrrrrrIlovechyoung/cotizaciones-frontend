import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { useAuth } from './stores/auth'
import ClientesView from './views/ClientesView'
import CotizacionesView from './views/CotizacionesView'
import LoginView from './views/LoginView'
import MiCuentaView from './views/MiCuentaView'
import RegistroView from './views/RegistroView'
import RecuperacionView from './views/RecuperacionView'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <div role="status" style={{ padding: 24 }}>Cargando sesión…</div>
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />

  return children
}

export default function App() {
  const { token, ready } = useAuth()
  if (!ready) return <div role="status" style={{ padding: 24 }}>Cargando sesión…</div>

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/cotizaciones" replace />} />
      <Route path="/registro" element={token ? <Navigate to="/cotizaciones" replace /> : <RegistroView />} />
      <Route path="/recuperar-contrasena" element={token ? <Navigate to="/cotizaciones" replace /> : <RecuperacionView />} />
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
