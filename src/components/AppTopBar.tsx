import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

import { listarAlertasVencimiento, type AlertaVencimiento } from '@/services/alertas'

const navItems = [
  { to: '/cotizaciones', icon: 'mdi-file-document-outline', label: 'Cotizaciones' },
  { to: '/clientes', icon: 'mdi-account-group-outline', label: 'Clientes' },
  { to: '/configuracion', icon: 'mdi-cog-outline', label: 'Configuración' },
]

export default function AppTopBar({ plegado, onAlternar, revisionAlertas }: {
  plegado: boolean
  onAlternar: () => void
  revisionAlertas?: number
}) {
  const [logoOk, setLogoOk] = useState(true)
  const [alertas, setAlertas] = useState<AlertaVencimiento[] | null>(null)
  const [errorAlertas, setErrorAlertas] = useState(false)
  const logoSrc = `${import.meta.env.BASE_URL}logo.png`

  useEffect(() => {
    const controller = new AbortController()
    let cargando = false
    async function actualizar() {
      if (cargando) return
      cargando = true
      try {
        const datos = await listarAlertasVencimiento(controller.signal)
        if (controller.signal.aborted) return
        setAlertas(datos)
        setErrorAlertas(false)
      } catch {
        if (!controller.signal.aborted) setErrorAlertas(true)
      } finally {
        cargando = false
      }
    }
    void actualizar()
    const intervalo = window.setInterval(actualizar, 60_000)
    window.addEventListener('focus', actualizar)
    return () => {
      controller.abort()
      window.clearInterval(intervalo)
      window.removeEventListener('focus', actualizar)
    }
  }, [revisionAlertas])

  return (
    <aside className="sidebar">
      <div className="sidebar__encabezado">
        <div className="sidebar__brand">
          {logoOk ? (
            <img src={logoSrc} alt="Sistema de Gestión de Cotizaciones" onError={() => setLogoOk(false)} />
          ) : (
            <div className="sidebar__brandmark">SG</div>
          )}
        </div>
        <button type="button" className="sidebar__alternar" aria-expanded={!plegado} aria-controls="sidebar-nav"
          aria-label={plegado ? 'Expandir menú' : 'Plegar menú'} title={plegado ? 'Expandir menú' : 'Plegar menú'} onClick={onAlternar}>
          <i className={`mdi ${plegado ? 'mdi-chevron-right' : 'mdi-chevron-left'}`} aria-hidden="true" />
        </button>
      </div>

      <nav id="sidebar-nav" className="sidebar__nav" aria-label="Navegación principal">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} aria-label={item.label} title={plegado ? item.label : undefined}
            state={item.to === '/cotizaciones' ? { volverACotizaciones: true } : undefined}>
            <i className={`mdi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
            <i className="mdi mdi-chevron-right sidebar__chevron" aria-hidden="true" />
          </NavLink>
        ))}
      </nav>

      <section className="sidebar__expiring" aria-label="Cotizaciones próximas a vencer">
        <div className="sidebar__divider" />
        <div className="sidebar__sectionTitle">Próximas a vencer</div>
        <div className="sidebar__expiringList">
          {errorAlertas ? <p>No se pudieron cargar las alertas.</p> : alertas === null ? (
            <p>Cargando alertas…</p>
          ) : alertas.length === 0 ? <p>Sin cotizaciones próximas a vencer.</p> : alertas.map((cotizacion) => (
            <Link key={cotizacion.id} to="/cotizaciones" state={{ cotizacionId: cotizacion.id }} className="sidebar__expiringItem">
              <span>
                <strong>{cotizacion.folio}</strong>
                <small>{cotizacion.cliente}</small>
              </span>
              <em>{cotizacion.diasRestantes === 0 ? 'Hoy' : cotizacion.diasRestantes === 1 ? 'Mañana' : `${cotizacion.diasRestantes} días`}</em>
            </Link>
          ))}
        </div>
      </section>
    </aside>
  )
}
