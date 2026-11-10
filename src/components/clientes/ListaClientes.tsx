import { useEffect, useMemo, useState } from 'react'

import type { ClienteRegistrado } from '@/data/clientes'
import { listarClientes } from '@/services/clientes'

const PAGE_SIZE = 6

export default function ListaClientes({ onNuevo, onAbrir }: {
  onNuevo: () => void
  onAbrir: (cliente: ClienteRegistrado) => void
}) {
  const [clientes, setClientes] = useState<ClienteRegistrado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)

  // Carga inicial desde la API (backend -> base de datos).
  useEffect(() => {
    let activo = true
    ;(async () => {
      try {
        const datos = await listarClientes()
        if (activo) setClientes(datos)
      } catch {
        if (activo) setError('No se pudieron cargar los clientes. Verifica tu conexión e intenta de nuevo.')
      } finally {
        if (activo) setCargando(false)
      }
    })()
    return () => {
      activo = false
    }
  }, [])

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((c) => c.nombreComercial.toLowerCase().includes(q) || c.rfc.toLowerCase().includes(q) || c.atencionA.toLowerCase().includes(q) || c.correoContacto.toLowerCase().includes(q))
  }, [buscar, clientes])
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  return (
    <div className="ws">
      <div className="filtros filtros--clientes">
        <div className="filtros__buscar">
          <i className="mdi mdi-magnify" aria-hidden="true" />
          <input value={buscar} placeholder="Buscar por nombre, RFC, correo o contacto" onChange={(e) => { setBuscar(e.target.value); setPagina(1) }} />
          {buscar && <button type="button" className="filtros__limpiar" title="Limpiar búsqueda" onClick={() => setBuscar('')}><i className="mdi mdi-close" /></button>}
        </div>
        <button type="button" className="btn btn--primary" onClick={onNuevo}><i className="mdi mdi-account-plus-outline" aria-hidden="true" /> Nuevo cliente</button>
      </div>
      <div className="ws__body">
        {cargando ? <div className="vacio"><i className="mdi mdi-loading mdi-spin" /><div className="vacio__titulo">Cargando clientes…</div></div>
          : error ? <div className="vacio"><i className="mdi mdi-alert-circle-outline" /><div className="vacio__titulo">Ocurrió un problema</div><div className="vacio__texto">{error}</div></div>
          : visibles.length === 0 ? <div className="vacio"><i className="mdi mdi-account-search-outline" /><div className="vacio__titulo">No hay clientes que coincidan</div><div className="vacio__texto">Ajusta la búsqueda o registra un cliente nuevo.</div></div>
          : <div className="lista">
              {visibles.map((cliente, i) => (
                <article key={cliente.idCliente} className="fila fila--cliente" style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}>
                  <header className="cliente-ficha__encabezado">
                    <div>
                      <h3>{cliente.nombreComercial}</h3>
                      <p>Cliente #{cliente.idCliente} · Tipo: {cliente.tipoCliente || 'Sin especificar'}</p>
                    </div>
                  </header>
                  <dl className="cliente-ficha__datos">
                    <div><dt>RFC</dt><dd>{cliente.rfc || 'Sin RFC'}</dd></div>
                    <div><dt>Contacto</dt><dd>{cliente.atencionA || 'Sin contacto asignado'}</dd></div>
                    <div><dt>Correo electrónico</dt><dd>{cliente.correoContacto || 'Sin correo'}</dd></div>
                    <div><dt>Teléfono</dt><dd>{cliente.telefonoContacto || 'Sin teléfono'}</dd></div>
                  </dl>
                  <button type="button" className="cliente-ficha__abrir" aria-label={`Ver ficha de ${cliente.nombreComercial}`}
                    onClick={() => onAbrir(cliente)} />
                </article>
              ))}
            </div>}
        {!cargando && !error && totalPaginas > 1 && <div className="paginacion"><div className="paginacion__info">Página {paginaActual} de {totalPaginas} · {filtrados.length} registro{filtrados.length === 1 ? '' : 's'}</div><div className="paginacion__botones"><button disabled={paginaActual <= 1} onClick={() => setPagina(paginaActual - 1)}>‹</button>{Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => <button key={p} className={p === paginaActual ? 'is-active' : ''} disabled={p === paginaActual} onClick={() => setPagina(p)}>{p}</button>)}<button disabled={paginaActual >= totalPaginas} onClick={() => setPagina(paginaActual + 1)}>›</button></div></div>}
      </div>
    </div>
  )
}
