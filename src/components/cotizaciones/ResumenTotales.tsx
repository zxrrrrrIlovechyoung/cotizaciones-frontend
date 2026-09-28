import { calcularTotales, dinero, type CotizacionForm } from '@/data/cotizaciones'

export default function ResumenTotales({ formulario }: { formulario: CotizacionForm }) {
  const t = calcularTotales(formulario)
  const claseUtilidad = t.utilidad < 0 ? 'is-negativa' : t.utilidad === 0 ? 'is-cero' : 'is-positiva'
  const conProducto = formulario.partidas.filter((p) => p.descripcion)

  return (
    <aside className="resumen">
      <div className="resumen__titulo">Resumen</div>
      <div className="resumen__total">
        <div className="resumen__monto">{dinero(t.total, formulario.moneda)}</div>
        {Number(formulario.porcentajeIva) > 0 && <div className="resumen__iva">IVA {formulario.porcentajeIva}%{formulario.preciosIncluyenIva ? ' incluido' : ' sobre precio'}</div>}
      </div>
      <div className="resumen__desglose">
        <div className="fila"><span>{formulario.preciosIncluyenIva ? 'Subtotal' : 'Subtotal s/IVA'}</span><span>{dinero(t.subtotal, formulario.moneda)}</span></div>
        <div className="fila"><span>Descuentos</span><span>{dinero(t.descuento, formulario.moneda)}</span></div>
        <div className="fila"><span>IVA</span><span>{dinero(t.impuestos, formulario.moneda)}</span></div>
        <div className="fila"><span>{formulario.preciosIncluyenIva ? 'Costo compra' : 'Costo compra s/IVA'}</span><span>{dinero(t.compra, formulario.moneda)}</span></div>
      </div>
      <div className="utilidad">
        <div className="utilidad__cabecera"><span>Utilidad estimada s/IVA</span>{t.subtotal > 0 && <span className={`utilidad__margen ${claseUtilidad}`}>Margen {t.margenPct >= 0 ? '+' : ''}{t.margenPct.toFixed(2)}%</span>}</div>
        <div className={`utilidad__monto ${claseUtilidad}`}>{dinero(t.utilidad, formulario.moneda)}</div>
      </div>
      {conProducto.length > 0 && <div className="productos__resumen"><div className="productos__titulo">Productos</div>{conProducto.map((p, i) => <div key={`${p.descripcion}-${i}`} className="productos__fila"><span className="productos__nombre">{p.descripcion}</span><span className="productos__cant">×{p.cantidad}</span></div>)}</div>}
    </aside>
  )
}
