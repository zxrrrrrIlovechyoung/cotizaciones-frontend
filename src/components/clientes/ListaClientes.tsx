import { useMemo, useState } from 'react'

import { CLIENTES, type ClienteRegistrado } from '@/data/clientes'

const PAGE_SIZE = 6

export default function ListaClientes({ onNuevo }: { onNuevo: () => void }) {
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [confirmarEliminar, setConfirmarEliminar] = useState<ClienteRegistrado | null>(null)
  const [, refrescar] = useState(0)
  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    if (!q) return CLIENTES
    return CLIENTES.filter((c) => c.nombreComercial.toLowerCase().includes(q) || c.rfc.toLowerCase().includes(q) || c.atencionA.toLowerCase().includes(q) || c.correoContacto.toLowerCase().includes(q))
  }, [buscar])
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  function eliminarConfirmado() {
    if (!confirmarEliminar) return
    const i = CLIENTES.findIndex((c) => c.idCliente === confirmarEliminar.idCliente)
    if (i !== -1) CLIENTES.splice(i, 1)
    setConfirmarEliminar(null)
    refrescar((v) => v + 1)
    if (paginaActual > totalPaginas) setPagina(totalPaginas)
  }

  return (
    <div className="ws">
      <div className="ws__head"><div className="ws__titles"><h2>Clientes</h2><p>Directorio de clientes registrados en el taller</p></div><button className="btn btn--primary" onClick={onNuevo}><i className="mdi mdi-account-plus-outline" /> Nuevo cliente</button></div>
      <div className="filtros"><div className="filtros__buscar"><i className="mdi mdi-magnify" /><input value={buscar} placeholder="Buscar por nombre, RFC, correo o contacto" onChange={(e) => { setBuscar(e.target.value); setPagina(1) }} />{buscar && <button className="filtros__limpiar" title="Limpiar búsqueda" onClick={() => setBuscar('')}><i className="mdi mdi-close" /></button>}</div></div>
      <div className="ws__body">
        {visibles.length === 0 ? <div className="vacio"><i className="mdi mdi-account-search-outline" /><div className="vacio__titulo">No hay clientes que coincidan</div><div className="vacio__texto">Ajusta la búsqueda o registra un cliente nuevo.</div></div> : <div className="lista">{visibles.map((c, i) => <div key={c.idCliente} className="fila fila--cliente" style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}><div className="fila__id"><strong>#{c.idCliente}</strong><span>{c.tipoCliente}</span></div><div className="fila__nombre"><strong>{c.nombreComercial}</strong><span>{c.atencionA || 'Sin contacto asignado'}</span></div><div className="fila__datos"><span>{c.correoContacto || 'Sin correo'}</span><span>{c.telefonoContacto || 'Sin teléfono'}</span></div><div className="fila__rfc">{c.rfc || '—'}</div><button type="button" className="fila__borrar" title="Eliminar cliente" onClick={() => setConfirmarEliminar(c)}><i className="mdi mdi-trash-can-outline" /></button></div>)}</div>}
        {totalPaginas > 1 && <div className="paginacion"><div className="paginacion__info">Página {paginaActual} de {totalPaginas} · {filtrados.length} registro{filtrados.length === 1 ? '' : 's'}</div><div className="paginacion__botones"><button disabled={paginaActual <= 1} onClick={() => setPagina(paginaActual - 1)}>‹</button>{Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => <button key={p} className={p === paginaActual ? 'is-active' : ''} disabled={p === paginaActual} onClick={() => setPagina(p)}>{p}</button>)}<button disabled={paginaActual >= totalPaginas} onClick={() => setPagina(paginaActual + 1)}>›</button></div></div>}
      </div>
      {confirmarEliminar && <div className="modal" onClick={() => setConfirmarEliminar(null)}><div className="modal__caja" onClick={(e) => e.stopPropagation()}><div className="modal__icono"><i className="mdi mdi-trash-can-outline" /></div><div className="modal__titulo">¿Eliminar este cliente?</div><div className="modal__texto"><strong>{confirmarEliminar.nombreComercial}</strong> se quitará del directorio. Esta acción no se puede deshacer.</div><div className="modal__acciones"><button type="button" className="ui-btn" onClick={() => setConfirmarEliminar(null)}>Cancelar</button><button type="button" className="ui-btn modal__borrar" onClick={eliminarConfirmado}>Sí, eliminar</button></div></div></div>}
    </div>
  )
}
