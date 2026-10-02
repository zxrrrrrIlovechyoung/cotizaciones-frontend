import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/cotizaciones', icon: 'mdi-file-document-outline', label: 'Cotizaciones' },
  { to: '/clientes', icon: 'mdi-account-group-outline', label: 'Clientes' },
  { to: '/configuracion', icon: 'mdi-cog-outline', label: 'Configuración' },
]

const cotizacionesPorVencer = [
  { folio: 'COT-0241', cliente: 'Autopartes Rivera', vence: 'Hoy' },
  { folio: 'COT-0238', cliente: 'Taller Norte', vence: 'Mañana' },
  { folio: 'COT-0235', cliente: 'Logística Aranda', vence: '3 días' },
]

export default function AppTopBar() {
  const [logoOk, setLogoOk] = useState(true)
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        {logoOk ? (
          <img src={logoSrc} alt="Sistema de Gestión de Cotizaciones" onError={() => setLogoOk(false)} />
        ) : (
          <div className="sidebar__brandmark">SG</div>
        )}
      </div>

      <nav className="sidebar__nav" aria-label="Navegación principal">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>
            <i className={`mdi ${item.icon}`} />
            <span>{item.label}</span>
            <i className="mdi mdi-chevron-right sidebar__chevron" />
          </NavLink>
        ))}
      </nav>

      <section className="sidebar__expiring" aria-label="Cotizaciones próximas a vencer">
        <div className="sidebar__divider" />
        <div className="sidebar__sectionTitle">Próximas a vencer</div>
        <div className="sidebar__expiringList">
          {cotizacionesPorVencer.map((cotizacion) => (
            <button key={cotizacion.folio} type="button" className="sidebar__expiringItem">
              <span>
                <strong>{cotizacion.folio}</strong>
                <small>{cotizacion.cliente}</small>
              </span>
              <em>{cotizacion.vence}</em>
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
