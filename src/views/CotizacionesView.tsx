import { useState } from 'react'

import AppTopBar from '@/components/AppTopBar'
import DetalleCotizacion from '@/components/cotizaciones/DetalleCotizacion'
import FormularioCotizacion from '@/components/cotizaciones/FormularioCotizacion'
import ListaCotizaciones from '@/components/cotizaciones/ListaCotizaciones'
import type { Cotizacion } from '@/data/cotizaciones'

export default function CotizacionesView() {
  const [vista, setVista] = useState<'lista' | 'detalle' | 'formulario'>('lista')
  const [seleccionada, setSeleccionada] = useState<Cotizacion | null>(null)

  function abrir(cotizacion: Cotizacion) {
    setSeleccionada(cotizacion)
    setVista('detalle')
  }

  function volver() {
    setSeleccionada(null)
    setVista('lista')
  }

  function eliminar() {
    if (seleccionada) seleccionada.estado = 'Eliminada'
    volver()
  }

  return (
    <div className="page">
      <AppTopBar />
      <main className="page__main">
        {vista === 'formulario' ? <FormularioCotizacion onVolver={volver} onGuardado={volver} /> : null}
        {vista === 'detalle' && seleccionada ? <DetalleCotizacion cotizacion={seleccionada} onVolver={volver} onEliminar={eliminar} /> : null}
        {vista === 'lista' ? <ListaCotizaciones onAbrir={abrir} onNueva={() => setVista('formulario')} /> : null}
      </main>
    </div>
  )
}
