import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '@/stores/auth'

interface AppHeaderProps {
  onCrearCotizacion?: () => void
  mostrarCrearCotizacion?: boolean
  contextual?: ReactNode
  accionAntesPerfil?: ReactNode
}

export default function AppHeader({ onCrearCotizacion, mostrarCrearCotizacion = true, contextual, accionAntesPerfil }: AppHeaderProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const nombre = user?.nombre ?? 'Usuario'
  const email = user?.email ?? 'Cuenta activa'

  function crearCotizacion() {
    if (onCrearCotizacion) onCrearCotizacion()
    else navigate('/cotizaciones', { state: { crearCotizacion: true } })
  }

  return (
    <header className="topbar">
      {contextual ? <div className="topbar__context">{contextual}</div> : null}

      <div className="topbar__actions">
        {mostrarCrearCotizacion ? (
          <button type="button" className="topbar__create" onClick={crearCotizacion}>
            <i className="mdi mdi-plus" />
            <span>Crear cotización</span>
          </button>
        ) : null}

        {accionAntesPerfil}

        <NavLink to="/mi-cuenta" className="topbar__account">
          <div className="topbar__accountText">
            <strong>{nombre}</strong>
            <span>{email}</span>
          </div>
          <div className="topbar__avatar" title={nombre}>
            <i className="mdi mdi-account-outline" />
          </div>
        </NavLink>
      </div>
    </header>
  )
}
