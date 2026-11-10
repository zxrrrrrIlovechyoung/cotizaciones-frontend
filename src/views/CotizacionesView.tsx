import { useCallback, useEffect, useState } from 'react'
import { useBlocker, useLocation, useNavigate } from 'react-router-dom'

import AppShell from '@/components/AppShell'
import ConfirmarSalidaCotizacion from '@/components/cotizaciones/ConfirmarSalidaCotizacion'
import DetalleCotizacion from '@/components/cotizaciones/DetalleCotizacion'
import DocumentoGuardado from '@/components/cotizaciones/DocumentoGuardado'
import FormularioCotizacion from '@/components/cotizaciones/FormularioCotizacion'
import ListaCotizaciones from '@/components/cotizaciones/ListaCotizaciones'
import { estaArchivada, type Cotizacion, type CotizacionForm } from '@/data/cotizaciones'
import { archivarCotizacion, eliminarCotizacion, formularioParaEditar, listarCotizaciones } from '@/services/cotizaciones'
import AlertaExito from '@/components/AlertaExito'
import { useAuth } from '@/stores/auth'

export default function CotizacionesView() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [vista, setVista] = useState<'lista' | 'detalle' | 'formulario'>('lista')
  const [seleccionada, setSeleccionada] = useState<Cotizacion | null>(null)
  const [archivo, setArchivo] = useState(false)
  const archivada = seleccionada !== null && estaArchivada(seleccionada)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)
  const [previsualizar, setPrevisualizar] = useState(false)
  const [errorDocumento, setErrorDocumento] = useState('')
  const [exito, setExito] = useState<{ editada: boolean; folio: string } | null>(null)
  const mostrarDocumentoGuardado = useCallback(() => {
    setExito(null)
    setPrevisualizar(true)
  }, [])
  const [edicion, setEdicion] = useState<CotizacionForm>()
  const [cargandoEdicion, setCargandoEdicion] = useState(false)
  const [archivando, setArchivando] = useState(false)
  const [revisionAlertas, setRevisionAlertas] = useState(0)
  const [errorAlerta, setErrorAlerta] = useState('')
  const [estadoEdicion, setEstadoEdicion] = useState({ modificado: false, guardando: false })
  const [salidaPendiente, setSalidaPendiente] = useState<(() => void) | null>(null)
  const protegerEdicion = Boolean(token) && vista === 'formulario' && estadoEdicion.modificado
  const bloqueo = useBlocker(protegerEdicion)

  useEffect(() => {
    if (!protegerEdicion) return
    function antesDeSalir(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', antesDeSalir)
    return () => window.removeEventListener('beforeunload', antesDeSalir)
  }, [protegerEdicion])

  function intentarSalir(accion: () => void) {
    if (protegerEdicion) setSalidaPendiente(() => accion)
    else accion()
  }

  function seguirEditando() {
    setSalidaPendiente(null)
    bloqueo.reset?.()
  }

  function salirSinGuardar() {
    if (estadoEdicion.guardando) return
    setSalidaPendiente(null)
    if (bloqueo.state === 'blocked') {
      volver()
      bloqueo.proceed()
    } else salidaPendiente?.()
  }

  const cotizacionId = (location.state as { cotizacionId?: number } | null)?.cotizacionId
  useEffect(() => {
    if (!(location.state as { crearCotizacion?: boolean } | null)?.crearCotizacion) return
    setSeleccionada(null)
    setEdicion(undefined)
    setVista('formulario')
    setErrorAlerta('')
    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  const abrir = useCallback((cotizacion: Cotizacion) => {
    setEdicion(undefined)
    setErrorDocumento('')
    setErrorAlerta('')
    setPrevisualizar(false)
    setConfirmarEliminar(false)
    setSeleccionada(cotizacion)
    setVista('detalle')
  }, [])

  useEffect(() => {
    if (!cotizacionId) return
    const controller = new AbortController()
    setErrorAlerta('')
    listarCotizaciones(controller.signal).then((cotizaciones) => {
      if (controller.signal.aborted) return
      const cotizacion = cotizaciones.find((c) => c.id === cotizacionId)
      if (cotizacion) {
        setArchivo(estaArchivada(cotizacion))
        abrir(cotizacion)
      }
      else setErrorAlerta('Esta cotización ya no está disponible.')
    }).catch(() => {
      if (!controller.signal.aborted) setErrorAlerta('No se pudo abrir la cotización. Intenta de nuevo.')
    }).finally(() => {
      if (!controller.signal.aborted) navigate(location.pathname, { replace: true, state: null })
    })
    return () => controller.abort()
  }, [cotizacionId, abrir, location.key, location.pathname, navigate])

  const volver = useCallback(() => {
    setEdicion(undefined)
    setPrevisualizar(false)
    setExito(null)
    setSeleccionada(null)
    setConfirmarEliminar(false)
    setVista('lista')
  }, [])

  useEffect(() => {
    if ((location.state as { volverACotizaciones?: boolean } | null)?.volverACotizaciones) volver()
  }, [location.key, location.state, volver])

  function solicitarVolver() {
    intentarSalir(volver)
  }

  function guardada(cotizacion: Cotizacion) {
    const fueEdicion = Boolean(edicion)
    seguirEditando()
    abrir(cotizacion)
    setRevisionAlertas((revision) => revision + 1)
    setExito({ editada: fueEdicion, folio: cotizacion.folio })
  }

  async function editar() {
    if (!seleccionada || archivada || archivando || cargandoEdicion) return
    setCargandoEdicion(true)
    setErrorDocumento('')
    try {
      const datos = await formularioParaEditar(seleccionada)
      setEdicion(datos)
      setPrevisualizar(false)
      setVista('formulario')
    } catch {
      setErrorDocumento('No se pudieron cargar todos los datos e imágenes. Intenta editar de nuevo.')
    } finally { setCargandoEdicion(false) }
  }

  async function archivar() {
    if (!seleccionada || archivada || archivando || cargandoEdicion) return
    const id = seleccionada.id
    setArchivando(true)
    setErrorDocumento('')
    try {
      await archivarCotizacion(id)
      setSeleccionada((actual) => actual?.id === id ? { ...actual, estado: 'Archivada', proximaAVencer: false } : actual)
      setArchivo(true)
      setRevisionAlertas((revision) => revision + 1)
    } catch {
      setErrorDocumento('No se pudo archivar la cotización. Vuelve al listado para consultar su estado.')
    } finally {
      setArchivando(false)
    }
  }

  async function eliminar() {
    if (!seleccionada || archivada || archivando) return
    // El backend hace el borrado suave (marca 'Eliminada'). Al volver al listado,
    // este se recarga desde la API y la cotización ya no aparece.
    try {
      await eliminarCotizacion(seleccionada.id)
      setRevisionAlertas((revision) => revision + 1)
      volver()
    } catch {
      setConfirmarEliminar(false)
      setErrorDocumento('No se pudo eliminar la cotización. Vuelve al listado para consultar su estado.')
    }
  }

  return (
    <AppShell
      revisionAlertas={revisionAlertas}
      onIntentarCerrarSesion={intentarSalir}
      mostrarCrearCotizacion={vista === 'lista'}
      headerContextual={vista === 'detalle' && seleccionada ? (
        <div className="topbar__contextBlock">
          <button type="button" className="topbar__back" title="Volver" disabled={archivando} onClick={solicitarVolver}>
            <i className="mdi mdi-arrow-left" />
          </button>
          <div className="topbar__folio">
            <span>{archivada ? 'Folio archivado' : 'Folio'}</span>
            <strong>{seleccionada.folio}</strong>
          </div>
        </div>
      ) : vista === 'formulario' ? (
        <div className="topbar__contextBlock">
          <button type="button" className="topbar__back" title="Volver" onClick={solicitarVolver}>
            <i className="mdi mdi-arrow-left" />
          </button>
          <div className="topbar__folio">
            <span>Cotización</span>
            <strong>{edicion ? `Editar ${seleccionada?.folio}` : 'Nueva cotización'}</strong>
          </div>
        </div>
      ) : vista === 'lista' ? (
        <div className="ws__titles topbar__tituloListado">
          <h2>Cotizaciones</h2>
          <p>Refacciones, mano de obra y servicios para clientes del taller</p>
        </div>
      ) : null}
      accionAntesPerfil={vista === 'detalle' && seleccionada ? (
        <>
          <button type="button" className="topbar__print" title="Previsualizar" aria-label="Previsualizar" onClick={() => { setErrorDocumento(''); setPrevisualizar(true) }}>
            <i className="mdi mdi-file-eye-outline" aria-hidden="true" />
            <span>Previsualizar</span>
          </button>
          {!archivada && <><button type="button" className="topbar__edit" disabled={cargandoEdicion || archivando} onClick={() => void editar()}>
            <i className="mdi mdi-pencil" />
            <span>{cargandoEdicion ? 'Cargando…' : 'Editar'}</span>
          </button>
          <button type="button" className="topbar__edit" title="Archivar cotización" aria-label="Archivar cotización"
            aria-busy={archivando} disabled={archivando || cargandoEdicion} onClick={() => void archivar()}>
            {archivando ? <i className="mdi mdi-loading mdi-spin" aria-hidden="true" /> : <i className="mdi mdi-archive-arrow-down-outline" aria-hidden="true" />}
            <span>{archivando ? 'Archivando…' : 'Archivar'}</span>
          </button>
          <button type="button" className="topbar__delete" disabled={archivando || cargandoEdicion} onClick={() => setConfirmarEliminar(true)}>
            <i className="mdi mdi-trash-can-outline" />
          </button></>}
        </>
      ) : vista === 'formulario' ? (
        <button type="button" className="topbar__print documento-toggle" aria-pressed={previsualizar} onClick={() => setPrevisualizar(!previsualizar)}>
          <i className="mdi mdi-file-eye-outline" aria-hidden="true" /><span>Previsualizar documento</span>
        </button>
      ) : null}
      onCrearCotizacion={() => {
        setEdicion(undefined)
        setSeleccionada(null)
        setVista('formulario')
      }}
    >
      {errorAlerta && <p className="form__error documento-error" role="alert">{errorAlerta}</p>}
      {vista === 'formulario' ? <FormularioCotizacion inicial={edicion} editandoId={edicion ? seleccionada?.id : undefined} onVolver={solicitarVolver} onGuardado={guardada} onEstadoEdicion={setEstadoEdicion} previsualizar={previsualizar} onCerrarPreview={() => setPrevisualizar(false)} /> : null}
      {protegerEdicion && (salidaPendiente || bloqueo.state === 'blocked') && (
        <ConfirmarSalidaCotizacion guardando={estadoEdicion.guardando} onSeguir={seguirEditando} onSalir={salirSinGuardar} />
      )}
      {vista === 'detalle' && errorDocumento && <p className="form__error documento-error" role="alert">{errorDocumento}</p>}
      {vista === 'detalle' && seleccionada ? <DetalleCotizacion key={`detalle-${seleccionada.id}`} cotizacion={seleccionada} onVolver={volver} onEliminar={eliminar} /> : null}
      {vista === 'detalle' && seleccionada && previsualizar && <DocumentoGuardado key={`documento-${seleccionada.id}`} cotizacion={seleccionada} nombre={user?.nombre ?? ''} soloConsulta={archivada} onClose={() => setPrevisualizar(false)} />}
      {exito && <AlertaExito titulo={exito.editada ? 'Cambios guardados' : 'Cotización creada'}
        mensaje={<>La cotización <strong>{exito.folio}</strong> se guardó correctamente.</>}
        accion="Ver documento" onContinuar={mostrarDocumentoGuardado} />}
      {vista === 'lista' ? <ListaCotizaciones archivo={archivo} onCambiarArchivo={setArchivo} onAbrir={abrir} /> : null}
      {confirmarEliminar && seleccionada ? <div className="modal" onClick={() => setConfirmarEliminar(false)}><div className="modal__caja" onClick={(e) => e.stopPropagation()}><div className="modal__icono"><i className="mdi mdi-trash-can-outline" /></div><div className="modal__titulo">¿Eliminar esta cotización?</div><div className="modal__texto"><strong>{seleccionada.folio}</strong> se quitará de la lista. Esta acción no se puede deshacer.</div><div className="modal__acciones"><button type="button" className="ui-btn" onClick={() => setConfirmarEliminar(false)}>Cancelar</button><button type="button" className="ui-btn modal__borrar" onClick={eliminar}>Sí, eliminar</button></div></div></div> : null}
    </AppShell>
  )
}
