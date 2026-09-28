import { useState } from 'react'

import ChipCompra from './ChipCompra'
import { dinero, fecha, type Cotizacion } from '@/data/cotizaciones'

export default function DetalleCotizacion({ cotizacion, onVolver, onEliminar }: { cotizacion: Cotizacion; onVolver: () => void; onEliminar: () => void }) {
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const datos = [
    { label: 'Cliente', valor: cotizacion.nombreComercial },
    { label: 'Atención', valor: cotizacion.atencionA || '—' },
    { label: 'Vigencia', valor: fecha(cotizacion.vigenciaHasta) },
    { label: 'Moneda', valor: cotizacion.moneda },
  ]

  return (
    <div className="detalle">
      <header className="detalle__head"><button className="icon-btn" title="Volver" onClick={onVolver}><i className="mdi mdi-arrow-left" /></button><div className="detalle__ident"><div className="detalle__linea"><h2>{cotizacion.folio}</h2><span className="detalle__version">Versión {cotizacion.version}</span></div><p>{cotizacion.nombreComercial} · {cotizacion.nombreAsesor}</p></div><button className="btn btn--primary"><i className="mdi mdi-printer" /> Imprimir / PDF</button><button className="btn"><i className="mdi mdi-pencil" /> Editar</button><button className="btn btn--peligro" onClick={() => setConfirmarEliminar(true)}><i className="mdi mdi-trash-can-outline" /> Eliminar</button></header>
      <div className="detalle__body"><div className="detalle__col"><section className="card card--datos">{datos.map((d) => <div key={d.label}><div className="etiqueta">{d.label}</div><div className="valor">{d.valor}</div></div>)}</section><section className="card card--partidas"><div className="card__titulo">Productos cotizados</div>{cotizacion.partidas.map((p, i) => <div key={p.id} className="partida" style={{ animationDelay: `${Math.min(i, 10) * 0.04}s` }}><span className="partida__num">{p.numeroPartida}</span><div className="partida__info"><div className="partida__linea"><strong>{p.descripcion}</strong><ChipCompra requiereCompra={p.requiereCompra} estadoCompra={p.estadoCompra} /></div><div className="partida__meta">{p.cantidad} {p.unidad}{p.sku ? ` · ${p.sku}` : ''}</div>{p.especificacionesTecnicas && <div className="partida__specs">{p.especificacionesTecnicas}</div>}{p.estadoCompra === 'Cancelada' && <div className="partida__alerta">Compra cancelada — esta partida no será surtida</div>}</div><div className="partida__precio">{dinero(p.precioUnitarioVenta, cotizacion.moneda)}</div><strong className="partida__importe">{dinero(p.importe, cotizacion.moneda)}</strong></div>)}</section></div><div className="detalle__col detalle__col--lateral"><section className="totales"><div className="totales__fila"><span>Subtotal</span><span>{dinero(cotizacion.subtotal, cotizacion.moneda)}</span></div><div className="totales__fila"><span>IVA</span><span>{dinero(cotizacion.impuestos, cotizacion.moneda)}</span></div><div className="totales__total"><span>Total</span><strong>{dinero(cotizacion.total, cotizacion.moneda)}</strong></div><div className="totales__utilidad"><span>Utilidad estimada</span><strong>{dinero(cotizacion.utilidadEstimada, cotizacion.moneda)}</strong></div></section></div></div>
      {confirmarEliminar && <div className="modal" onClick={() => setConfirmarEliminar(false)}><div className="modal__caja" onClick={(e) => e.stopPropagation()}><div className="modal__icono"><i className="mdi mdi-trash-can-outline" /></div><div className="modal__titulo">¿Eliminar esta cotización?</div><div className="modal__texto"><strong>{cotizacion.folio}</strong> se quitará de la lista. Esta acción no se puede deshacer.</div><div className="modal__acciones"><button type="button" className="ui-btn" onClick={() => setConfirmarEliminar(false)}>Cancelar</button><button type="button" className="ui-btn modal__borrar" onClick={onEliminar}>Sí, eliminar</button></div></div></div>}
    </div>
  )
}
