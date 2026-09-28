import { useMemo, useState } from 'react'

import { COTIZACIONES, dinero, fecha, type Cotizacion } from '@/data/cotizaciones'

const PAGE_SIZE = 5

export default function ListaCotizaciones({ onAbrir, onNueva }: { onAbrir: (cotizacion: Cotizacion) => void; onNueva: () => void }) {
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const filtradas = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    return COTIZACIONES.filter((c) => c.estado !== 'Eliminada' && (!q || c.folio.toLowerCase().includes(q) || c.nombreComercial.toLowerCase().includes(q) || c.atencionA.toLowerCase().includes(q)))
  }, [buscar])
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  function limpiarFiltros() {
    setBuscar('')
    setPagina(1)
  }

  return (
    <div className="ws">
      <div className="ws__head"><div className="ws__titles"><h2>Cotizaciones</h2><p>Refacciones, mano de obra y servicios para clientes del taller</p></div><button className="btn btn--primary" onClick={onNueva}><i className="mdi mdi-file-plus-outline" /> Nueva cotización</button></div>
      <div className="filtros"><div className="filtros__buscar"><i className="mdi mdi-magnify" /><input value={buscar} placeholder="Buscar por folio, cliente o contacto" onChange={(e) => { setBuscar(e.target.value); setPagina(1) }} />{buscar && <button className="filtros__limpiar" title="Limpiar búsqueda" onClick={() => setBuscar('')}><i className="mdi mdi-close" /></button>}</div><button className="filtros__refrescar" title="Restablecer filtros" onClick={limpiarFiltros}><i className="mdi mdi-refresh" /></button></div>
      <div className="ws__body">
        {visibles.length === 0 ? <div className="vacio"><i className="mdi mdi-package-variant-closed" /><div className="vacio__titulo">No hay cotizaciones que coincidan</div><div className="vacio__texto">Ajusta la búsqueda.</div></div> : <div className="lista">{visibles.map((c, i) => <button key={c.id} className="fila fila--cotizacion" style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }} onClick={() => onAbrir(c)}><div className="fila__folio"><strong>{c.folio}</strong><span>Versión {c.version}</span></div><div className="fila__cliente"><strong>{c.nombreComercial}</strong><span>{c.tipoCliente} · {c.partidas.length} partida{c.partidas.length === 1 ? '' : 's'}</span></div><div className="fila__total"><strong>{dinero(c.total, c.moneda)}</strong><span>{fecha(c.vigenciaHasta)}</span></div><i className="mdi mdi-chevron-right fila__chevron" /></button>)}</div>}
        {totalPaginas > 1 && <Paginacion paginaActual={paginaActual} totalPaginas={totalPaginas} total={filtradas.length} onPagina={setPagina} />}
      </div>
    </div>
  )
}

function Paginacion({ paginaActual, totalPaginas, total, onPagina }: { paginaActual: number; totalPaginas: number; total: number; onPagina: (p: number) => void }) {
  return <div className="paginacion"><div className="paginacion__info">Página {paginaActual} de {totalPaginas} · {total} registro{total === 1 ? '' : 's'}</div><div className="paginacion__botones"><button disabled={paginaActual <= 1} onClick={() => onPagina(paginaActual - 1)}>‹</button>{Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => <button key={p} className={p === paginaActual ? 'is-active' : ''} disabled={p === paginaActual} onClick={() => onPagina(p)}>{p}</button>)}<button disabled={paginaActual >= totalPaginas} onClick={() => onPagina(paginaActual + 1)}>›</button></div></div>
}
