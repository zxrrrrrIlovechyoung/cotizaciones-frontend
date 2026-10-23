import { useEffect, useMemo, useState } from 'react'

import type { ClienteRegistrado } from '@/data/clientes'
import { eliminarCliente, listarClientes } from '@/services/clientes'

const PAGE_SIZE = 6

export default function ListaClientes({ onNuevo }: { onNuevo: () => void }) {
  const [clientes, setClientes] = useState<ClienteRegistrado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [confirmarEliminar, setConfirmarEliminar] = useState<ClienteRegistrado | null>(null)
  const [eliminando, setEliminando] = useState(false)

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

  async function eliminarConfirmado() {
    if (!confirmarEliminar || eliminando) return
    const id = confirmarEliminar.idCliente
    setEliminando(true)
    try {
      await eliminarCliente(id)
      setClientes((actual) => actual.filter((c) => c.idCliente !== id))
      setConfirmarEliminar(null)
      if (paginaActual > totalPaginas) setPagina(totalPaginas)
    } catch {
      setError('No se pudo eliminar el cliente. Intenta de nuevo.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="ws">
      <div className="ws__head"><div className="ws__titles"><h2>Clientes</h2><p>Directorio de clientes registrados en el taller</p></div><button className="btn btn--primary" onClick={onNuevo}><i className="mdi mdi-account-plus-outline" /> Nuevo cliente</button></div>
      <div className="filtros"><div className="filtros__buscar"><i className="mdi mdi-magnify" /><input value={buscar} placeholder="Buscar por nombre, RFC, correo o contacto" onChange={(e) => { setBuscar(e.target.value); setPagina(1) }} />{buscar && <button className="filtros__limpiar" title="Limpiar búsqueda" onClick={() => setBuscar('')}><i className="mdi mdi-close" /></button>}</div></div>
      <div className="ws__body">
        {cargando ? <div className="vacio"><i className="mdi mdi-loading mdi-spin" /><div className="vacio__titulo">Cargando clientes…</div></div>
          : error ? <div className="vacio"><i className="mdi mdi-alert-circle-outline" /><div className="vacio__titulo">Ocurrió un problema</div><div className="vacio__texto">{error}</div></div>
          : visibles.length === 0 ? <div className="vacio"><i className="mdi mdi-account-search-outline" /><div className="vacio__titulo">No hay clientes que coincidan</div><div className="vacio__texto">Ajusta la búsqueda o registra un cliente nuevo.</div></div>
          : <div className="lista">{visibles.map((c, i) => <div key={c.idCliente} className="fila fila--cliente" style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}><div className="fila__id"><strong>#{c.idCliente}</strong><span>{c.tipoCliente}</span></div><div className="fila__nombre"><strong>{c.nombreComercial}</strong><span>{c.atencionA || 'Sin contacto asignado'}</span></div><div className="fila__datos"><span>{c.correoContacto || 'Sin correo'}</span><span>{c.telefonoContacto || 'Sin teléfono'}</span></div><div className="fila__rfc">{c.rfc || '—'}</div><button type="button" className="fila__borrar" title="Eliminar cliente" onClick={() => setConfirmarEliminar(c)}><i className="mdi mdi-trash-can-outline" /></button></div>)}</div>}
        {!cargando && !error && totalPaginas > 1 && <div className="paginacion"><div className="paginacion__info">Página {paginaActual} de {totalPaginas} · {filtrados.length} registro{filtrados.length === 1 ? '' : 's'}</div><div className="paginacion__botones"><button disabled={paginaActual <= 1} onClick={() => setPagina(paginaActual - 1)}>‹</button>{Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => <button key={p} className={p === paginaActual ? 'is-active' : ''} disabled={p === paginaActual} onClick={() => setPagina(p)}>{p}</button>)}<button disabled={paginaActual >= totalPaginas} onClick={() => setPagina(paginaActual + 1)}>›</button></div></div>}
      </div>
      {confirmarEliminar && <div className="modal" onClick={() => setConfirmarEliminar(null)}><div className="modal__caja" onClick={(e) => e.stopPropagation()}><div className="modal__icono"><i className="mdi mdi-trash-can-outline" /></div><div className="modal__titulo">¿Eliminar este cliente?</div><div className="modal__texto"><strong>{confirmarEliminar.nombreComercial}</strong> se quitará del directorio. Esta acción no se puede deshacer.</div><div className="modal__acciones"><button type="button" className="ui-btn" onClick={() => setConfirmarEliminar(null)} disabled={eliminando}>Cancelar</button><button type="button" className="ui-btn modal__borrar" onClick={eliminarConfirmado} disabled={eliminando}>{eliminando ? 'Eliminando…' : 'Sí, eliminar'}</button></div></div></div>}
    </div>
  )
}
