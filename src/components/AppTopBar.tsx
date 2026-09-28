import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const empresa = 'Taller Mecánico El Roble'

const navItems = [
  { to: '/cotizaciones', icon: 'mdi-file-document-outline', label: 'Cotizaciones' },
  { to: '/clientes', icon: 'mdi-account-group-outline', label: 'Clientes' },
  { to: '/configuracion', icon: 'mdi-cog-outline', label: 'Configuración' },
]

export default function AppTopBar() {
  const [logoOk, setLogoOk] = useState(true)
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`
  const iniciales = empresa
    .split(' ')
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        {logoOk ? (
          <img src={logoSrc} alt="Sistema de Gestión de Cotizaciones" onError={() => setLogoOk(false)} />
        ) : (
          <div className="sidebar__brandmark">SG</div>
        )}
      </div>

      <NavLink to="/mi-cuenta" className="sidebar__account">
        <div className="sidebar__avatar" title={empresa}>{iniciales}</div>
        <div className="sidebar__accountText">
          <span>Cuenta activa</span>
          <strong>{empresa}</strong>
        </div>
      </NavLink>

      <nav className="sidebar__nav" aria-label="Navegación principal">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to}>
            <i className={`mdi ${item.icon}`} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
