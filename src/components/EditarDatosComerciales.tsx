import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import axios from 'axios'

import {
  formatearFechaEdicion, guardarDatosComerciales, LIMITES_PERFIL_CUENTA, obtenerPerfilCuenta,
  type DatosComerciales, type PerfilCuenta,
} from '@/services/perfilCuenta'

const VACIO: DatosComerciales = { comercial: '', razonSocial: '', rfc: '', telefono: '', direccion: '' }

export default function EditarDatosComerciales({ onCerrar, onGuardado }: {
  onCerrar: () => void
  onGuardado: (perfil: PerfilCuenta) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titulo = useId()
  const ayuda = useId()
  const [perfil, setPerfil] = useState<PerfilCuenta | null>(null)
  const [form, setForm] = useState(VACIO)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const empresa = perfil?.tipo === 'Empresa'

  useEffect(() => {
    const node = dialog.current
    const controller = new AbortController()
    node?.showModal()
    obtenerPerfilCuenta(controller.signal).then((datos) => {
      if (controller.signal.aborted) return
      if (!datos) {
        setError('Esta cuenta todavía no tiene datos comerciales registrados.')
        return
      }
      setPerfil(datos)
      setForm(datos)
    }).catch(() => {
      if (!controller.signal.aborted) setError('No se pudieron cargar los datos comerciales. Cierra el editor y vuelve a intentarlo.')
    })
    return () => {
      controller.abort()
      node?.close()
    }
  }, [])

  const datos = {
    comercial: form.comercial.trim(),
    razonSocial: empresa ? form.razonSocial.trim() : '',
    rfc: form.rfc.trim().toUpperCase(),
    telefono: form.telefono,
    direccion: form.direccion.trim(),
  }
  const bloqueado = !perfil?.puedeEditar || guardando
  const huboCambios = perfil && (Object.keys(datos) as Array<keyof DatosComerciales>).some((campo) => datos[campo] !== perfil[campo])
  const telefonoValido = datos.telefono === '' || /^\d{10}$/.test(datos.telefono)
  const puedeGuardar = !bloqueado && huboCambios && telefonoValido
    && Array.from(datos.comercial).length >= 2 && (!empresa || Array.from(datos.razonSocial).length >= 2)
  const fecha = perfil?.disponibleDesde && !perfil.puedeEditar ? formatearFechaEdicion(perfil.disponibleDesde) : null

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!puedeGuardar) return
    setGuardando(true)
    setError('')
    try {
      onGuardado(await guardarDatosComerciales(datos))
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        const actual: PerfilCuenta = error.response.data
        setPerfil(actual)
        setForm(actual)
      } else {
        const mensaje = axios.isAxiosError<{ error?: string }>(error) && error.response?.status === 400
          ? error.response.data.error : undefined
        setError(mensaje ?? 'No se pudieron guardar los datos. Intenta de nuevo.')
      }
    } finally {
      setGuardando(false)
    }
  }

  function campo(clave: keyof DatosComerciales, etiqueta: string, maximo: number, requerido = false) {
    return (
      <label className="cuenta__field">
        <span>{etiqueta}</span>
        <input className="ui-input" type={clave === 'telefono' ? 'tel' : 'text'} value={form[clave]}
          required={requerido} minLength={requerido ? 2 : undefined} maxLength={maximo}
          aria-invalid={clave === 'telefono' && !telefonoValido}
          onChange={(event) => {
            let valor = event.target.value
            if (clave === 'telefono') valor = valor.replace(/\D/g, '')
            if (clave === 'rfc') valor = valor.toUpperCase().slice(0, maximo)
            setForm((anterior) => ({ ...anterior, [clave]: valor }))
          }} />
        {clave === 'telefono' && !telefonoValido && <small className="campo__error">Ingresa 10 dígitos.</small>}
      </label>
    )
  }

  return (
    <dialog ref={dialog} className="editor-partida cuenta__editorComercial" aria-labelledby={titulo} aria-describedby={ayuda}
      onCancel={(event) => { event.preventDefault(); if (!guardando) onCerrar() }}>
      <header className="editor-partida__head">
        <h2 id={titulo}>Editar datos comerciales</h2>
        <button type="button" className="editor-partida__icon" aria-label="Cerrar editor" disabled={guardando} onClick={onCerrar}>
          <i className="mdi mdi-close" aria-hidden="true" />
        </button>
      </header>
      <form onSubmit={guardar}>
        <div className="editor-partida__body">
          <p id={ayuda} className="cuenta__nota">
            {fecha ? <>Podrás volver a editar estos datos el <strong>{fecha}</strong> (hora de Ciudad de México).</>
              : 'Puedes editar estos datos una vez cada 60 días.'}
          </p>
          {!perfil && !error && <p className="cuenta__nota" role="status">Cargando datos comerciales…</p>}
          {perfil && <>
            <fieldset className="cuenta__camposEdicion" disabled={bloqueado}>
              <legend>Identidad comercial</legend>
              {campo('comercial', empresa ? 'Nombre comercial' : 'Nombre profesional o comercial', LIMITES_PERFIL_CUENTA.comercial, true)}
              {empresa && campo('razonSocial', 'Razón social', LIMITES_PERFIL_CUENTA.razonSocial, true)}
              {campo('rfc', 'RFC', 13)}
            </fieldset>
            <fieldset className="cuenta__camposEdicion" disabled={bloqueado}>
              <legend>Contacto</legend>
              {campo('telefono', 'Teléfono de contacto', 10)}
              {campo('direccion', 'Dirección comercial', LIMITES_PERFIL_CUENTA.direccion)}
            </fieldset>
          </>}
          {error && <p className="campo__error" role="alert">{error}</p>}
        </div>
        <footer className="editor-partida__actions">
          <button type="button" className="ui-btn" disabled={guardando} onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="ui-btn ui-btn--primary" disabled={!puedeGuardar}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
