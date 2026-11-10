import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import axios from 'axios'

import CampoContrasena from './CampoContrasena'
import RequisitosContrasena from './RequisitosContrasena'
import { limitarContrasena, longitudContrasenaAdmitida, MAX_CARACTERES_CONTRASENA, reglasContrasena } from '@/data/contrasena'
import api from '@/services/api'

const mensajesVerificacion = {
  inactiva: '',
  comprobando: 'Comprobando contraseña…',
  valida: 'Contraseña actual correcta.',
  incorrecta: 'La contraseña actual es incorrecta.',
  limite: 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
  error: 'No se pudo verificar la contraseña. Vuelve a escribirla para reintentar.',
}

export default function CambiarContrasena({ onCerrar, onGuardado }: { onCerrar: () => void; onGuardado: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const comprobacionActual = useRef<AbortController | null>(null)
  const titulo = useId()
  const requisitos = useId()
  const estadoActual = useId()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [verificacion, setVerificacion] = useState<keyof typeof mensajesVerificacion>('inactiva')
  const noCoincide = confirmar !== '' && confirmar !== nueva
  const repetida = nueva !== '' && nueva === actual
  const actualAdmitida = longitudContrasenaAdmitida(actual)
  const verificarActual = Array.from(actual).length >= 6 && actualAdmitida
  const bytesValidos = longitudContrasenaAdmitida(nueva)
  const cumpleReglas = reglasContrasena.every((regla) => regla.test(nueva))
  const puedeGuardar = !guardando && verificacion === 'valida'
    && bytesValidos && cumpleReglas && !repetida && nueva === confirmar
  const mensajeActual = !actualAdmitida ? 'La contraseña actual supera el límite de 72 bytes.'
    : mensajesVerificacion[verificacion]
  const errorActual = !actualAdmitida || verificacion === 'incorrecta'

  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])

  useEffect(() => {
    if (!verificarActual) return
    const controller = new AbortController()
    comprobacionActual.current = controller
    setVerificacion('comprobando')
    const timer = window.setTimeout(() => {
      api.post<{ valida: boolean }>('/auth/password/verificar', { actual }, { signal: controller.signal })
        .then(({ data }) => {
          if (!controller.signal.aborted) setVerificacion(data.valida ? 'valida' : 'incorrecta')
        })
        .catch((error) => {
          if (controller.signal.aborted) return
          setVerificacion(axios.isAxiosError(error) && error.response?.status === 429 ? 'limite' : 'error')
        })
    }, 600)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [actual, verificarActual])

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!puedeGuardar) return
    setGuardando(true)
    setError('')
    try {
      await api.put('/auth/password', { actual, nueva, confirmar }, { skipAuthRedirect: true })
      onGuardado()
    } catch (error) {
      const respuesta = axios.isAxiosError<{ error?: string }>(error) ? error.response : undefined
      if (respuesta?.status === 401) setVerificacion('incorrecta')
      else if (respuesta?.status === 429) setVerificacion('limite')
      else setError(respuesta?.status === 400 && respuesta.data.error ? respuesta.data.error
        : 'No se pudo cambiar la contraseña. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <dialog ref={dialog} className="editor-partida" aria-labelledby={titulo}
      onCancel={(event) => { event.preventDefault(); if (!guardando) onCerrar() }}>
      <header className="editor-partida__head">
        <h2 id={titulo}>Cambiar contraseña</h2>
        <button type="button" className="editor-partida__icon" aria-label="Cerrar" disabled={guardando} onClick={onCerrar}>
          <i className="mdi mdi-close" aria-hidden="true" />
        </button>
      </header>
      <form onSubmit={guardar}>
        <fieldset className="editor-partida__body configuracion__camposPassword" disabled={guardando}>
          <CampoContrasena etiqueta="Contraseña actual" autoComplete="current-password" required maxLength={MAX_CARACTERES_CONTRASENA * 2}
              value={actual} aria-invalid={errorActual} aria-describedby={mensajeActual ? estadoActual : undefined}
              onChange={(event) => {
                const valor = limitarContrasena(event.target.value)
                if (valor === actual) return
                comprobacionActual.current?.abort()
                setVerificacion('inactiva')
                setActual(valor)
                setError('')
              }}>
            {mensajeActual && <small id={estadoActual} className={`configuracion__estadoClave${verificacion === 'valida' ? ' is-ok' : errorActual || verificacion === 'error' || verificacion === 'limite' ? ' is-error' : ''}`} role="status">
              {mensajeActual}
            </small>}
          </CampoContrasena>
          <CampoContrasena etiqueta="Nueva contraseña" autoComplete="new-password" required maxLength={MAX_CARACTERES_CONTRASENA * 2}
              aria-describedby={requisitos} aria-invalid={nueva !== '' && (!cumpleReglas || repetida || !bytesValidos)}
              value={nueva} onChange={(event) => { setNueva(limitarContrasena(event.target.value)); setError('') }} />
          <CampoContrasena etiqueta="Confirmar nueva contraseña" nombreVisibilidad="confirmación de contraseña"
              autoComplete="new-password" required maxLength={MAX_CARACTERES_CONTRASENA * 2}
              value={confirmar} aria-invalid={noCoincide} onChange={(event) => { setConfirmar(limitarContrasena(event.target.value)); setError('') }} />
          <RequisitosContrasena id={requisitos} contrasena={nueva} />
          {repetida && <p className="campo__error" role="alert">La nueva contraseña debe ser distinta de la actual.</p>}
          {!bytesValidos && <p className="campo__error" role="alert">La nueva contraseña supera el límite de 72 bytes.</p>}
          {noCoincide && <p className="campo__error" role="alert">Las contraseñas no coinciden.</p>}
          {error && <p className="campo__error" role="alert">{error}</p>}
        </fieldset>
        <footer className="editor-partida__actions">
          <button type="button" className="ui-btn" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="ui-btn ui-btn--primary" disabled={!puedeGuardar}>
            {guardando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </footer>
      </form>
    </dialog>
  )
}
