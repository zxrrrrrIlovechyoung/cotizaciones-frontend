import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import AppShell from '@/components/AppShell'
import DetalleCotizacion from '@/components/cotizaciones/DetalleCotizacion'
import FormularioCotizacion from '@/components/cotizaciones/FormularioCotizacion'
import ListaCotizaciones from '@/components/cotizaciones/ListaCotizaciones'
import type { Cotizacion } from '@/data/cotizaciones'

export default function CotizacionesView() {
  const location = useLocation()
  const navigate = useNavigate()
  const [vista, setVista] = useState<'lista' | 'detalle' | 'formulario'>('lista')
  const [seleccionada, setSeleccionada] = useState<Cotizacion | null>(null)

  useEffect(() => {
    if ((location.state as { crearCotizacion?: boolean } | null)?.crearCotizacion) {
      setSeleccionada(null)
      setVista('formulario')
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate])

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
    <AppShell onCrearCotizacion={() => {
      setSeleccionada(null)
      setVista('formulario')
    }}>
      {vista === 'formulario' ? <FormularioCotizacion onVolver={volver} onGuardado={volver} /> : null}
      {vista === 'detalle' && seleccionada ? <DetalleCotizacion cotizacion={seleccionada} onVolver={volver} onEliminar={eliminar} /> : null}
      {vista === 'lista' ? <ListaCotizaciones onAbrir={abrir} onNueva={() => setVista('formulario')} /> : null}
    </AppShell>
  )
}
