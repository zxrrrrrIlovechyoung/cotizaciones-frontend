import { useMemo, useState } from 'react'

import { COTIZACIONES, dinero, fecha, type Cotizacion } from '@/data/cotizaciones'

const PAGE_SIZE = 10
const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

const mesActual = new Date().getMonth() + 1
const anioActual = new Date().getFullYear()
const anios = Array.from(
  new Set([...COTIZACIONES.map((c) => obtenerAnio(c.vigenciaHasta)).filter((a): a is number => Boolean(a)), anioActual]),
).sort((a, b) => Number(b) - Number(a))

export default function ListaCotizaciones({ onAbrir }: { onAbrir: (cotizacion: Cotizacion) => void; onNueva: () => void }) {
  const [mes, setMes] = useState(String(mesActual))
  const [anio, setAnio] = useState(String(anioActual))
  const [razonSocial, setRazonSocial] = useState('')
  const [rfc, setRfc] = useState('')
  const [nombreCliente, setNombreCliente] = useState('')
  const [pagina, setPagina] = useState(1)
  const filtradas = useMemo(() => {
    const razon = normalizar(razonSocial)
    const rfcFiltro = normalizar(rfc)
    const cliente = normalizar(nombreCliente)

    return COTIZACIONES.filter((c) => {
      if (c.estado === 'Eliminada') return false
      if (mes && obtenerMes(c.vigenciaHasta) !== Number(mes)) return false
      if (anio && obtenerAnio(c.vigenciaHasta) !== Number(anio)) return false
      if (razon && !normalizar(c.razonSocial || c.nombreComercial).includes(razon)) return false
      if (rfcFiltro && !normalizar(c.rfc).includes(rfcFiltro)) return false
      if (cliente && !normalizar(c.nombreCliente || c.atencionA || c.nombreComercial).includes(cliente)) return false
      return true
    })
  }, [anio, mes, nombreCliente, razonSocial, rfc])
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  return (
    <div className="ws">
      <div className="ws__head ws__head--sinAccion"><div className="ws__titles"><h2>Cotizaciones</h2><p>Refacciones, mano de obra y servicios para clientes del taller</p></div></div>
      <div className="filtros filtros--cotizaciones">
        <label className="filtro">
          <span>Mes</span>
          <select value={mes} onChange={(e) => { setMes(e.target.value); setPagina(1) }}>
            <option value="">Todos</option>
            {MESES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
        <label className="filtro filtro--anio">
          <span>Año</span>
          <select value={anio} onChange={(e) => { setAnio(e.target.value); setPagina(1) }}>
            <option value="">Todos</option>
            {anios.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="filtro">
          <span>Razón social</span>
          <input value={razonSocial} placeholder="Ej. Distribuidora El Roble" onChange={(e) => { setRazonSocial(e.target.value); setPagina(1) }} />
        </label>
        <label className="filtro filtro--rfc">
          <span>RFC</span>
          <input value={rfc} placeholder="DER950101AB1" onChange={(e) => { setRfc(e.target.value.toUpperCase()); setPagina(1) }} />
        </label>
        <label className="filtro">
          <span>Cliente</span>
          <input value={nombreCliente} placeholder="Nombre del cliente" onChange={(e) => { setNombreCliente(e.target.value); setPagina(1) }} />
        </label>
        <button className="filtros__buscarBtn" type="button" onClick={() => setPagina(1)}><i className="mdi mdi-magnify" /><span>Buscar</span></button>
      </div>
      <div className="ws__body">
        {visibles.length === 0 ? <div className="vacio"><i className="mdi mdi-package-variant-closed" /><div className="vacio__titulo">No hay cotizaciones que coincidan</div><div className="vacio__texto">Ajusta los filtros.</div></div> : <div className="lista">{visibles.map((c, i) => <button key={c.id} className="fila fila--cotizacion" style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }} onClick={() => onAbrir(c)}><div className="fila__fecha"><span>Creación</span><strong>{fecha(c.fechaCreacion)}</strong></div><div className="fila__folio"><span>Folio</span><strong>{c.folio}</strong></div><div className="fila__cliente"><span>Razón social</span><strong>{c.razonSocial}</strong></div><div className="fila__rfc"><span>RFC</span><strong>{c.rfc}</strong></div><div className="fila__nombre"><span>Nombre</span><strong>{c.nombreCliente}</strong></div><div className="fila__montos"><div><span>Utilidad</span><strong>{dinero(c.utilidadEstimada, c.moneda)}</strong></div><div><span>Costo</span><strong>{dinero(c.costo, c.moneda)}</strong></div><div><span>Total</span><strong>{dinero(c.total, c.moneda)}</strong></div></div><i className="mdi mdi-chevron-right fila__chevron" /></button>)}</div>}
        {totalPaginas > 1 && <Paginacion paginaActual={paginaActual} totalPaginas={totalPaginas} total={filtradas.length} onPagina={setPagina} />}
      </div>
    </div>
  )
}

function normalizar(value: string) {
  return value.trim().toLowerCase()
}

function obtenerMes(fechaValor: string) {
  if (!fechaValor) return null
  return new Date(`${fechaValor.slice(0, 10)}T12:00:00`).getMonth() + 1
}

function obtenerAnio(fechaValor: string) {
  if (!fechaValor) return null
  return new Date(`${fechaValor.slice(0, 10)}T12:00:00`).getFullYear()
}

function Paginacion({ paginaActual, totalPaginas, total, onPagina }: { paginaActual: number; totalPaginas: number; total: number; onPagina: (p: number) => void }) {
  return <div className="paginacion"><div className="paginacion__info">Página {paginaActual} de {totalPaginas} · {total} registro{total === 1 ? '' : 's'}</div><div className="paginacion__botones"><button disabled={paginaActual <= 1} onClick={() => onPagina(paginaActual - 1)}>‹</button>{Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => <button key={p} className={p === paginaActual ? 'is-active' : ''} disabled={p === paginaActual} onClick={() => onPagina(p)}>{p}</button>)}<button disabled={paginaActual >= totalPaginas} onClick={() => onPagina(paginaActual + 1)}>›</button></div></div>
}
