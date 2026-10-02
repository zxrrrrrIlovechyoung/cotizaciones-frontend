import { useState } from 'react'

import { dinero, fecha, type Cotizacion } from '@/data/cotizaciones'

export default function DetalleCotizacion({ cotizacion }: { cotizacion: Cotizacion; onVolver: () => void; onEliminar: () => void }) {
  const [partidaActiva, setPartidaActiva] = useState<Cotizacion['partidas'][number] | null>(null)
  const datos = [
    { label: 'Razón social', valor: cotizacion.razonSocial },
    { label: 'RFC', valor: cotizacion.rfc },
    { label: 'Fecha de creación', valor: fecha(cotizacion.fechaCreacion) },
    { label: 'Nombre del cliente', valor: cotizacion.nombreCliente },
    { label: 'Vigencia', valor: fecha(cotizacion.vigenciaHasta) },
  ]

  return (
    <div className="detalle">
      <div className="detalle__body"><div className="detalle__col"><section className="card card--datos">{datos.map((d) => <div key={d.label}><div className="etiqueta">{d.label}</div><div className="valor">{d.valor}</div></div>)}</section><section className="card card--partidas"><div className="card__titulo">Productos cotizados</div>{cotizacion.partidas.map((p, i) => <button key={p.id} type="button" className="partida" style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }} onClick={() => setPartidaActiva(p)}><div className="partida__media" aria-label="Imágenes del producto"><span><i className="mdi mdi-image-outline" /><small>Sin imagen</small></span><span><i className="mdi mdi-image-outline" /><small>Sin imagen</small></span></div><div className="partida__info"><div className="partida__linea"><strong>{p.descripcion}</strong></div><div className="partida__meta">{p.cantidad} {p.unidad}{p.sku ? ` · ${p.sku}` : ''}</div>{p.especificacionesTecnicas && <div className="partida__specs">{p.especificacionesTecnicas}</div>}</div><div className="partida__precio">{dinero(p.precioUnitarioVenta, cotizacion.moneda)}</div><strong className="partida__importe">{dinero(p.importe, cotizacion.moneda)}</strong></button>)}</section></div></div>
      <footer className="detalle__footer">
        <div><span>Costo</span><strong>{dinero(cotizacion.costo, cotizacion.moneda)}</strong></div>
        <div><span>Subtotal</span><strong>{dinero(cotizacion.subtotal, cotizacion.moneda)}</strong></div>
        <div><span>IVA</span><strong>{dinero(cotizacion.impuestos, cotizacion.moneda)}</strong></div>
        <div><span>Utilidad</span><strong>{dinero(cotizacion.utilidadEstimada, cotizacion.moneda)}</strong></div>
        <div className="detalle__footerTotal"><span>Total</span><strong>{dinero(cotizacion.total, cotizacion.moneda)}</strong></div>
      </footer>
      {partidaActiva ? <div className="modal modal--partida" onClick={() => setPartidaActiva(null)}><div className="partida-modal" onClick={(e) => e.stopPropagation()}><div className="partida-modal__head"><div><span>Partida</span><h3>{partidaActiva.descripcion}</h3></div><button type="button" className="partida-modal__close" title="Cerrar" onClick={() => setPartidaActiva(null)}><i className="mdi mdi-close" /></button></div><div className="partida-modal__imagenes"><div><i className="mdi mdi-image-outline" /><strong>Sin imagen</strong></div><div><i className="mdi mdi-image-outline" /><strong>Sin imagen</strong></div></div><div className="partida-modal__datos"><div><span>Cantidad</span><strong>{partidaActiva.cantidad} {partidaActiva.unidad}</strong></div><div><span>SKU</span><strong>{partidaActiva.sku || 'Sin SKU'}</strong></div><div><span>Precio unitario</span><strong>{dinero(partidaActiva.precioUnitarioVenta, cotizacion.moneda)}</strong></div><div><span>Importe</span><strong>{dinero(partidaActiva.importe, cotizacion.moneda)}</strong></div></div>{partidaActiva.especificacionesTecnicas ? <div className="partida-modal__specs"><span>Especificaciones</span><p>{partidaActiva.especificacionesTecnicas}</p></div> : null}</div></div> : null}
    </div>
  )
}
