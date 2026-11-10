import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import axios from 'axios'

import CampoContrasena from './CampoContrasena'
import { limitarContrasena, longitudContrasenaAdmitida, MAX_CARACTERES_CONTRASENA } from '@/data/contrasena'
import api from '@/services/api'

const ruta = '/auth/eliminacion'
type Paso = 'correo' | 'codigo' | 'eliminar'

export default function EliminarCuenta({ correo, onCerrar, onEliminada }: {
  correo: string
  onCerrar: () => void
  onEliminada: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titulo = useId()
  const condiciones = useId()
  const [paso, setPaso] = useState<Paso>('correo')
  const [codigo, setCodigo] = useState('')
  const [permiso, setPermiso] = useState('')
  const [actual, setActual] = useState('')
  const [aceptaCondiciones, setAceptaCondiciones] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState<Paso | null>(null)
  const [error, setError] = useState('')
  const ocupado = accionPendiente !== null
  const actualValida = Array.from(actual).length >= 6 && longitudContrasenaAdmitida(actual)

  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])

  async function procesar(accion: Paso) {
    if (ocupado || (accion === 'codigo' && codigo.length !== 6)
      || (accion === 'eliminar' && (!permiso || !actualValida || !aceptaCondiciones))) return
    setAccionPendiente(accion)
    setError('')
    try {
      if (accion === 'correo') {
        await api.post(`${ruta}/solicitar`)
        setCodigo('')
        setPaso('codigo')
      } else if (accion === 'codigo') {
        const { data } = await api.post<{ permiso: string }>(`${ruta}/verificar`, { codigo })
        setPermiso(data.permiso)
        setCodigo('')
        setPaso('eliminar')
      } else {
        await api.delete(ruta, { data: { permiso, actual, aceptaCondiciones } })
        setActual('')
        setPermiso('')
        onEliminada()
      }
    } catch (error) {
      const respuesta = axios.isAxiosError<{ error?: string }>(error) ? error.response : undefined
      if (respuesta?.status === 410) {
        setPaso('correo')
        setPermiso('')
        setActual('')
        setAceptaCondiciones(false)
      }
      setError(respuesta?.data?.error ?? (respuesta?.status === 429
        ? 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.'
        : 'No se pudo completar la solicitud. Intenta de nuevo.'))
    } finally {
      setAccionPendiente(null)
    }
  }

  function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void procesar(paso)
  }

  return (
    <dialog ref={dialog} className="editor-partida" aria-labelledby={titulo}
      onCancel={(event) => { event.preventDefault(); if (!ocupado) onCerrar() }}>
      <header className="editor-partida__head">
        <h2 id={titulo}>Eliminar mi cuenta</h2>
        <button type="button" className="editor-partida__icon" aria-label="Cerrar" disabled={ocupado} onClick={onCerrar}>
          <i className="mdi mdi-close" aria-hidden="true" />
        </button>
      </header>
      <form onSubmit={enviarFormulario}>
        <fieldset className="editor-partida__body configuracion__camposPassword" disabled={ocupado}>
          {paso === 'correo' && <p className="configuracion__ayuda">Enviaremos un código exclusivo de eliminación a <strong>{correo}</strong>.</p>}
          {paso === 'codigo' && <>
            <p className="configuracion__ayuda">Ingresa el código de eliminación de seis dígitos enviado a <strong>{correo}</strong>. Es válido por 10 minutos.</p>
            <label className="cuenta__field">
              <span>Código de verificación</span>
              <input className="ui-input" type="text" inputMode="numeric" autoComplete="one-time-code" required
                value={codigo} onChange={(event) => { setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }} />
            </label>
            <button type="button" className="ui-btn recuperacion__reenviar" onClick={() => void procesar('correo')}>
              {accionPendiente === 'correo' ? <><span className="spinner eliminacion__spinner" aria-hidden="true" /> Enviando código…</> : 'Solicitar otro código'}
            </button>
          </>}
          {paso === 'eliminar' && <>
            <CampoContrasena etiqueta="Contraseña actual" autoComplete="current-password" required
              maxLength={MAX_CARACTERES_CONTRASENA * 2} value={actual}
              onChange={(event) => { setActual(limitarContrasena(event.target.value)); setError('') }} />
            <div className="eliminacion__condiciones" id={condiciones}>
              <strong>Condiciones de eliminación</strong>
              <p>Se eliminarán definitivamente tu cuenta, perfil, clientes, cotizaciones, imágenes e historiales. Se cerrarán todas tus sesiones. Esta acción es irreversible.</p>
            </div>
            <label className="eliminacion__aceptar">
              <input type="checkbox" className="ui-check" aria-describedby={condiciones} checked={aceptaCondiciones}
                onChange={(event) => setAceptaCondiciones(event.target.checked)} required />
              <span>Acepto las condiciones de eliminación.</span>
            </label>
          </>}
          {error && <p className="campo__error" role="alert">{error}</p>}
        </fieldset>
        <footer className="editor-partida__actions">
          <button type="button" className="ui-btn" onClick={onCerrar} disabled={ocupado}>Cancelar</button>
          <button type="submit" className={`ui-btn ${paso === 'eliminar' ? 'modal__borrar' : 'ui-btn--primary'}`}
            disabled={ocupado || (paso === 'codigo' && codigo.length !== 6) || (paso === 'eliminar' && (!actualValida || !aceptaCondiciones))}>
            {accionPendiente === paso ? <>
              <span className="spinner" aria-hidden="true" /> {paso === 'correo' ? 'Enviando código…' : 'Procesando…'}
            </> : paso === 'correo' ? 'Enviar código de eliminación' : paso === 'codigo' ? 'Verificar código' : 'Eliminar cuenta'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
