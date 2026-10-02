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
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

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
    setConfirmarEliminar(false)
    setVista('lista')
  }

  function eliminar() {
    if (seleccionada) seleccionada.estado = 'Eliminada'
    volver()
  }

  return (
    <AppShell
      mostrarCrearCotizacion={vista === 'lista'}
      headerContextual={vista === 'detalle' && seleccionada ? (
        <div className="topbar__contextBlock">
          <button type="button" className="topbar__back" title="Volver" onClick={volver}>
            <i className="mdi mdi-arrow-left" />
          </button>
          <div className="topbar__folio">
            <span>Folio</span>
            <strong>{seleccionada.folio}</strong>
          </div>
        </div>
      ) : vista === 'formulario' ? (
        <div className="topbar__contextBlock">
          <button type="button" className="topbar__back" title="Volver" onClick={volver}>
            <i className="mdi mdi-arrow-left" />
          </button>
          <div className="topbar__folio">
            <span>Cotización</span>
            <strong>Nueva cotización</strong>
          </div>
        </div>
      ) : null}
      accionAntesPerfil={vista === 'detalle' && seleccionada ? (
        <>
          <button type="button" className="topbar__print">
            <i className="mdi mdi-printer" />
            <span>Imprimir / PDF</span>
          </button>
          <button type="button" className="topbar__edit">
            <i className="mdi mdi-pencil" />
            <span>Editar</span>
          </button>
          <button type="button" className="topbar__delete" onClick={() => setConfirmarEliminar(true)}>
            <i className="mdi mdi-trash-can-outline" />
          </button>
        </>
      ) : null}
      onCrearCotizacion={() => {
        setSeleccionada(null)
        setVista('formulario')
      }}
    >
      {vista === 'formulario' ? <FormularioCotizacion onVolver={volver} onGuardado={volver} /> : null}
      {vista === 'detalle' && seleccionada ? <DetalleCotizacion cotizacion={seleccionada} onVolver={volver} onEliminar={eliminar} /> : null}
      {vista === 'lista' ? <ListaCotizaciones onAbrir={abrir} onNueva={() => setVista('formulario')} /> : null}
      {confirmarEliminar && seleccionada ? <div className="modal" onClick={() => setConfirmarEliminar(false)}><div className="modal__caja" onClick={(e) => e.stopPropagation()}><div className="modal__icono"><i className="mdi mdi-trash-can-outline" /></div><div className="modal__titulo">¿Eliminar esta cotización?</div><div className="modal__texto"><strong>{seleccionada.folio}</strong> se quitará de la lista. Esta acción no se puede deshacer.</div><div className="modal__acciones"><button type="button" className="ui-btn" onClick={() => setConfirmarEliminar(false)}>Cancelar</button><button type="button" className="ui-btn modal__borrar" onClick={eliminar}>Sí, eliminar</button></div></div></div> : null}
    </AppShell>
  )
}
