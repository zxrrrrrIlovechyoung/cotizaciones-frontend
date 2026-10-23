import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/stores/auth'

interface AppHeaderProps {
  onCrearCotizacion?: () => void
  mostrarCrearCotizacion?: boolean
  contextual?: ReactNode
  accionAntesPerfil?: ReactNode
}

export default function AppHeader({ onCrearCotizacion, mostrarCrearCotizacion = true, contextual, accionAntesPerfil }: AppHeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const nombre = user?.nombre ?? 'Usuario'
  const email = user?.email ?? 'Cuenta activa'
  const [menuAbierto, setMenuAbierto] = useState(false)
  const cuentaRef = useRef<HTMLDivElement>(null)

  function crearCotizacion() {
    if (onCrearCotizacion) onCrearCotizacion()
    else navigate('/cotizaciones', { state: { crearCotizacion: true } })
  }

  // Cierra el menú al hacer clic fuera o al presionar Escape.
  useEffect(() => {
    if (!menuAbierto) return
    function alClicFuera(e: MouseEvent) {
      if (cuentaRef.current && !cuentaRef.current.contains(e.target as Node)) setMenuAbierto(false)
    }
    function alEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuAbierto(false)
    }
    document.addEventListener('mousedown', alClicFuera)
    document.addEventListener('keydown', alEscape)
    return () => {
      document.removeEventListener('mousedown', alClicFuera)
      document.removeEventListener('keydown', alEscape)
    }
  }, [menuAbierto])

  function irAMiCuenta() {
    setMenuAbierto(false)
    navigate('/mi-cuenta')
  }

  function cerrarSesion() {
    setMenuAbierto(false)
    logout()
    navigate('/login')
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

        <div className="topbar__accountWrap" ref={cuentaRef}>
          <button
            type="button"
            className={`topbar__account ${menuAbierto ? 'active' : ''}`}
            onClick={() => setMenuAbierto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
          >
            <div className="topbar__accountText">
              <strong>{nombre}</strong>
              <span>{email}</span>
            </div>
            <div className="topbar__avatar" title={nombre}>
              <i className="mdi mdi-account-outline" />
            </div>
            <i className={`mdi mdi-chevron-down topbar__accountChevron ${menuAbierto ? 'is-open' : ''}`} />
          </button>

          {menuAbierto ? (
            <div className="topbar__menu" role="menu">
              <button type="button" role="menuitem" className="topbar__menuItem" onClick={irAMiCuenta}>
                <i className="mdi mdi-account-cog-outline" />
                <span>Mi cuenta</span>
              </button>
              <div className="topbar__menuSep" />
              <button type="button" role="menuitem" className="topbar__menuItem topbar__menuItem--danger" onClick={cerrarSesion}>
                <i className="mdi mdi-logout" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
