import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import axios from 'axios'

import AlertaExito from '@/components/AlertaExito'
import IconoConfiguracion from './IconoConfiguracion'
import { imagenDocumento, LOGO_DOCUMENTO_PREDETERMINADO } from '@/services/documentoCotizacion'
import { eliminarLogoCuenta, guardarLogoCuenta } from '@/services/perfilCuenta'

export default function LogoDocumento({ logo, disponible, onPreview, onGuardado }: {
  logo?: string
  disponible: boolean
  onPreview: (logo: string | null) => void
  onGuardado: (logo: string | undefined) => void
}) {
  const selector = useRef<HTMLInputElement>(null)
  const [pendiente, setPendiente] = useState<{ archivo: File; vista: string } | null>(null)
  const [preparando, setPreparando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorLogo, setErrorLogo] = useState('')
  const [confirmacion, setConfirmacion] = useState<'guardado' | 'eliminado' | null>(null)
  const cerrarConfirmacion = useCallback(() => setConfirmacion(null), [])
  const imagen = pendiente?.vista ?? logo
  const ocupado = preparando || guardando || eliminando

  async function seleccionar(event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!archivo || ocupado) return
    if (!['image/png', 'image/jpeg'].includes(archivo.type) || archivo.size === 0 || archivo.size > 2 * 1024 * 1024) {
      setErrorLogo('Selecciona un PNG o JPG de hasta 2 MB.')
      return
    }
    setPreparando(true)
    setErrorLogo('')
    try {
      const vista = await imagenDocumento(archivo)
      const img = new Image()
      img.src = vista
      await img.decode()
      if (img.naturalWidth > 8000 || img.naturalHeight > 8000) throw new Error()
      setPendiente({ archivo, vista })
      onPreview(vista)
    } catch {
      setErrorLogo('Selecciona una imagen válida de hasta 8000 píxeles por lado.')
    } finally {
      setPreparando(false)
    }
  }

  async function guardar() {
    if (!pendiente || ocupado) return
    setGuardando(true)
    setErrorLogo('')
    try {
      await guardarLogoCuenta(pendiente.archivo)
      onGuardado(pendiente.vista)
      onPreview(null)
      setPendiente(null)
      setConfirmacion('guardado')
    } catch (error) {
      const mensaje = axios.isAxiosError<{ error?: string }>(error) ? error.response?.data?.error : undefined
      setErrorLogo(mensaje ?? 'No se pudo guardar el logo. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!logo || pendiente || ocupado) return
    setEliminando(true)
    setErrorLogo('')
    try {
      await eliminarLogoCuenta()
      onGuardado(undefined)
      setConfirmacion('eliminado')
    } catch {
      setErrorLogo('No se pudo eliminar el logo. Intenta de nuevo.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <section className="cuenta__card" aria-labelledby="documento-logo">
      <header className="cuenta__encabezado">
        <IconoConfiguracion icono="documento" />
        <div><h3 id="documento-logo">Logo de la cotización</h3><p>Aparece en el encabezado del documento.</p></div>
      </header>
      {disponible ? <>
        <input ref={selector} type="file" accept="image/png,image/jpeg" onChange={seleccionar} hidden />
        <button type="button" className="documento-config__logo" disabled={ocupado} onClick={() => selector.current?.click()}>
          <img src={imagen ?? LOGO_DOCUMENTO_PREDETERMINADO} alt={imagen ? '' : 'Logo predeterminado de la aplicación'} />
          <span>{preparando ? <><span className="spinner documento-config__spinner" aria-hidden="true" /> Preparando…</>
            : <><i className="mdi mdi-pencil-outline" aria-hidden="true" /> {imagen ? 'Cambiar logo' : 'Agregar logo'}</>}</span>
        </button>
        {logo && !pendiente && <div className="documento-config__acciones">
          <button type="button" className="ui-btn modal__borrar" disabled={ocupado} aria-busy={eliminando} onClick={() => void eliminar()}>
            {eliminando ? <><span className="spinner" aria-hidden="true" /> Eliminando…</> : 'Eliminar logo'}
          </button>
        </div>}
        {pendiente && <div className="documento-config__acciones">
          <button type="button" className="ui-btn ui-btn--primary" disabled={ocupado} aria-busy={guardando} onClick={() => void guardar()}>
            {guardando ? <><span className="spinner" aria-hidden="true" /> Guardando logo…</> : 'Guardar logo'}
          </button>
          <button type="button" className="ui-btn" disabled={ocupado} onClick={() => { setPendiente(null); onPreview(null); setErrorLogo('') }}>Cancelar</button>
        </div>}
        <p className="configuracion__ayuda documento-config__logoNota">PNG o JPG · Máximo 2 MB</p>
        {errorLogo && <div className="cuenta__aviso documento-config__logoNota is-error" role="alert">{errorLogo}</div>}
      </> : <p className="configuracion__ayuda">El logo se puede editar cuando la cuenta tiene un perfil comercial registrado.</p>}
      {confirmacion && <AlertaExito titulo={confirmacion === 'eliminado' ? 'Logo eliminado' : 'Logo actualizado'}
        mensaje={confirmacion === 'eliminado' ? 'Se usará el logo predeterminado en las próximas cotizaciones.' : 'El logo de la cotización se guardó correctamente.'}
        accion="Aceptar" onContinuar={cerrarConfirmacion} />}
    </section>
  )
}
