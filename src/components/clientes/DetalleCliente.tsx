import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import type { ClienteRegistrado } from '@/data/clientes'
import { dinero } from '@/data/cotizaciones'
import { obtenerHistorialCliente } from '@/services/clientes'

const formatoFecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'America/Mexico_City' })

export default function DetalleCliente({ cliente }: { cliente: ClienteRegistrado }) {
  const [historial, setHistorial] = useState<Awaited<ReturnType<typeof obtenerHistorialCliente>>>()
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    obtenerHistorialCliente(cliente.idCliente, controller.signal).then((datos) => {
      if (!controller.signal.aborted) setHistorial(datos)
    }).catch(() => {
      if (!controller.signal.aborted) setError(true)
    })
    return () => controller.abort()
  }, [cliente.idCliente])

  const cotizaciones = historial?.cotizaciones
  const ultima = cotizaciones?.[0]
  const datos = [
    ['Fecha de alta', historial ? formatoFecha.format(new Date(historial.fechaAlta)) : '—'],
    ['RFC', cliente.rfc || 'Sin RFC'],
    ['Contacto', cliente.atencionA || 'Sin contacto asignado'],
    ['Correo electrónico', cliente.correoContacto || 'Sin correo'],
    ['Teléfono', cliente.telefonoContacto || 'Sin teléfono'],
    ['Última cotización', ultima ? formatoFecha.format(new Date(ultima.fechaCreacion)) : cotizaciones ? 'Sin cotizaciones' : '—'],
  ]

  return (
    <div className="ws">
      <div className="ws__body cliente-detalle">
        <section className="panel" aria-labelledby="cliente-datos-titulo">
          <h3 id="cliente-datos-titulo">Datos del cliente</h3>
          <dl className="cliente-ficha__datos">
            {datos.map(([etiqueta, valor]) => <div key={etiqueta}><dt>{etiqueta}</dt><dd>{valor}</dd></div>)}
          </dl>
        </section>
        <section className="panel" aria-labelledby="cliente-cotizaciones-titulo">
          <h3 id="cliente-cotizaciones-titulo">Historial de cotizaciones{cotizaciones && ` (${cotizaciones.length})`}</h3>
          {error ? <p role="alert">No se pudo cargar el historial de cotizaciones.</p>
            : !cotizaciones ? <p role="status">Cargando cotizaciones…</p>
            : cotizaciones.length === 0 ? <p>Este cliente todavía no tiene cotizaciones.</p>
            : <ul className="cliente-detalle__historial">
                {cotizaciones.map((cotizacion, indice) => (
                  <li key={cotizacion.id}>
                    <Link className="cliente-detalle__cotizacion" to="/cotizaciones" state={{ cotizacionId: cotizacion.id }}>
                      <strong>Folio {cotizacion.folio}</strong>
                      <time dateTime={cotizacion.fechaCreacion}>{formatoFecha.format(new Date(cotizacion.fechaCreacion))}</time>
                      <span>{dinero(cotizacion.total, cotizacion.moneda)} {cotizacion.moneda}</span>
                      <span>{[indice === 0 && 'Más reciente', cotizacion.archivada && 'Archivada'].filter(Boolean).join(' · ')}</span>
                    </Link>
                  </li>
                ))}
              </ul>}
        </section>
        {historial && historial.foliosEliminados.length > 0 && (
          <section className="panel" aria-labelledby="cliente-eliminadas-titulo">
            <h3 id="cliente-eliminadas-titulo">Folios eliminados</h3>
            <ul className="cliente-detalle__folios">
              {historial.foliosEliminados.map((folio) => <li key={folio}>Folio {folio}</li>)}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
