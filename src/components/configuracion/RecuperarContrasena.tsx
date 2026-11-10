import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import axios from 'axios'

import CampoContrasena from './CampoContrasena'
import RequisitosContrasena from './RequisitosContrasena'
import AlertaExito from '@/components/AlertaExito'
import { limitarContrasena, longitudContrasenaAdmitida, MAX_CARACTERES_CONTRASENA, reglasContrasena } from '@/data/contrasena'
import api from '@/services/api'

type Paso = 'correo' | 'codigo' | 'clave' | 'exito'
const ruta = '/auth/recuperacion'

function formatearEspera(segundos: number) {
  const horas = Math.floor(segundos / 3600)
  const minutos = Math.floor(segundos / 60) % 60
  const partes = horas > 0 ? [horas, minutos, segundos % 60] : [minutos, segundos % 60]
  return partes.map((parte) => String(parte).padStart(2, '0')).join(':')
}

export default function RecuperarContrasena({ correoInicial = '', correoFijo = false, enPagina = false, onCerrar, onFinalizar }: {
  correoInicial?: string
  correoFijo?: boolean
  enPagina?: boolean
  onCerrar: () => void
  onFinalizar: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const entradaCodigo = useRef<HTMLInputElement>(null)
  const titulo = useId()
  const requisitos = useId()
  const avisoConfirmacion = useId()
  const [paso, setPaso] = useState<Paso>('correo')
  const [correo, setCorreo] = useState(correoInicial)
  const [solicitud, setSolicitud] = useState('')
  const [codigo, setCodigo] = useState('')
  const [permiso, setPermiso] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [reenviarDesde, setReenviarDesde] = useState(0)
  const [ahora, setAhora] = useState(Date.now)
  const segundosRestantes = Math.max(0, Math.ceil((reenviarDesde - ahora) / 1000))
  const puedeReenviar = segundosRestantes === 0
  const correoValido = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.trim())
  const cumpleReglas = reglasContrasena.every((regla) => regla.test(nueva))
  const bytesValidos = longitudContrasenaAdmitida(nueva)
  const noCoincide = confirmar !== '' && nueva !== confirmar
  const puedeGuardar = cumpleReglas && bytesValidos && nueva === confirmar
  const exito = paso === 'exito'

  useEffect(() => {
    if (exito || enPagina) return
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [exito, enPagina])

  useEffect(() => {
    if (puedeReenviar) return
    const timer = window.setInterval(() => setAhora(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [puedeReenviar, reenviarDesde])

  useEffect(() => {
    if (paso === 'codigo' && !ocupado) entradaCodigo.current?.focus()
  }, [paso, ocupado])

  function iniciarEspera(segundos: number) {
    const instante = Date.now()
    setAhora(instante)
    setReenviarDesde(instante + segundos * 1000)
  }

  async function procesar(accion: Paso) {
    if (ocupado || (accion === 'correo' && (!correoValido || !puedeReenviar))
      || (accion === 'codigo' && codigo.length !== 6) || (accion === 'clave' && !puedeGuardar)) return
    setOcupado(true)
    setError('')
    try {
      if (accion === 'correo') {
        const { data } = await api.post<{ solicitud: string; esperaSegundos: number }>(`${ruta}/solicitar`, { email: correo.trim() })
        setSolicitud(data.solicitud)
        setCodigo('')
        iniciarEspera(data.esperaSegundos)
        setPaso('codigo')
      } else if (accion === 'codigo') {
        const { data } = await api.post<{ permiso: string }>(`${ruta}/verificar`, { solicitud, codigo })
        setPermiso(data.permiso)
        setCodigo('')
        setSolicitud('')
        setPaso('clave')
      } else if (accion === 'clave') {
        await api.post(`${ruta}/restablecer`, { permiso, nueva, confirmar })
        setPermiso('')
        setNueva('')
        setConfirmar('')
        setPaso('exito')
      }
    } catch (error) {
      const respuesta = axios.isAxiosError<{ error?: string; esperaSegundos?: number }>(error) ? error.response : undefined
      if (accion === 'correo' && respuesta?.status === 429) {
        iniciarEspera(respuesta.data?.esperaSegundos ?? 60)
        return
      }
      if (respuesta?.status === 410) {
        setPermiso('')
        setPaso('correo')
      }
      setError(respuesta?.status === 429 ? 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.'
        : respuesta?.data?.error ?? 'No se pudo completar la solicitud. Intenta de nuevo.')
    } finally {
      setOcupado(false)
    }
  }

  function enviarFormulario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void procesar(paso)
  }

  if (exito) {
    if (enPagina) return <>
      <h1>Contraseña restablecida</h1>
      <p className="registration__subtitle" role="status">Ya puedes iniciar sesión con tu nueva contraseña.</p>
      <div className="registration__actions">
        <button type="button" className="registration__primary" onClick={onFinalizar}>Volver a iniciar sesión</button>
      </div>
    </>
    return <AlertaExito titulo="Contraseña restablecida" mensaje="Ya puedes iniciar sesión con tu nueva contraseña."
      accion="Aceptar" onContinuar={onFinalizar} />
  }

  const formulario = (
    <form onSubmit={enviarFormulario} aria-busy={ocupado}>
      <fieldset className={enPagina ? 'configuracion__camposPassword' : 'editor-partida__body configuracion__camposPassword'} disabled={ocupado}>
        {paso === 'correo' && <label className="cuenta__field">
          <span>Correo electrónico registrado</span>
          <input className="ui-input" type="email" autoComplete="email" required maxLength={100}
            value={correo} readOnly={correoFijo} onChange={(event) => { setCorreo(event.target.value); setError('') }} />
        </label>}
        {paso === 'codigo' && <>
          <p className="configuracion__ayuda" role="status">Si el correo está registrado, recibirás un código de seis dígitos válido por 10 minutos.</p>
          <label className="cuenta__field">
            <span>Código de verificación</span>
            <input ref={entradaCodigo} className="ui-input" type="text" inputMode="numeric" autoComplete="one-time-code" required
              value={codigo} onChange={(event) => { setCodigo(event.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }} />
          </label>
          <button type="button" className="ui-btn recuperacion__reenviar" disabled={!puedeReenviar}
            onClick={() => void procesar('correo')}>
            Solicitar otro código
          </button>
        </>}
        {(paso === 'codigo' || (paso === 'correo' && !puedeReenviar)) &&
          <p className="configuracion__ayuda">Tiempo para solicitar otro código: <strong className="recuperacion__contador" role="timer">{formatearEspera(segundosRestantes)}</strong></p>}
        {paso === 'clave' && <>
          <CampoContrasena etiqueta="Nueva contraseña" autoComplete="new-password" required maxLength={MAX_CARACTERES_CONTRASENA * 2}
              aria-describedby={requisitos} aria-invalid={nueva !== '' && (!cumpleReglas || !bytesValidos)}
              value={nueva} onChange={(event) => { setNueva(limitarContrasena(event.target.value)); setError('') }} />
          <CampoContrasena etiqueta="Confirmar nueva contraseña" nombreVisibilidad="confirmación de contraseña"
              autoComplete="new-password" required maxLength={MAX_CARACTERES_CONTRASENA * 2}
              aria-invalid={noCoincide} aria-describedby={noCoincide ? avisoConfirmacion : undefined}
              value={confirmar} onChange={(event) => { setConfirmar(limitarContrasena(event.target.value)); setError('') }} />
          <RequisitosContrasena id={requisitos} contrasena={nueva} />
          {noCoincide && <p id={avisoConfirmacion} className="campo__error" role="status">Las contraseñas no coinciden.</p>}
          {!bytesValidos && <p className="campo__error" role="status">La nueva contraseña supera el límite de 72 bytes.</p>}
        </>}
        {error && <p className="campo__error" role="alert">{error}</p>}
      </fieldset>
      <footer className={enPagina ? 'registration__actions' : 'editor-partida__actions'}>
        {!enPagina && <button type="button" className="ui-btn" onClick={onCerrar} disabled={ocupado}>Cancelar</button>}
        <button type="submit" className={enPagina ? 'registration__primary' : 'ui-btn ui-btn--primary'}
          disabled={ocupado || (paso === 'correo' ? !correoValido || !puedeReenviar : paso === 'codigo' ? codigo.length !== 6 : !puedeGuardar)}>
          {ocupado ? <><span className="spinner" aria-hidden="true" /> Procesando…</>
            : paso === 'correo' ? 'Enviar código' : paso === 'codigo' ? 'Verificar código' : 'Restablecer contraseña'}
        </button>
      </footer>
    </form>
  )

  if (enPagina) return <>
    <h1>Recuperar contraseña</h1>
    <p className="registration__subtitle">{paso === 'correo' ? 'Ingresa el correo asociado a tu cuenta.'
      : paso === 'codigo' ? 'Escribe el código que te enviamos.' : 'Elige una nueva contraseña para tu cuenta.'}</p>
    {formulario}
    <div className="registration__login">
      <button type="button" className="registration__back recuperacion__volver" disabled={ocupado} onClick={onCerrar}>Volver a iniciar sesión</button>
    </div>
  </>

  return (
    <dialog ref={dialog} className="editor-partida" aria-labelledby={titulo}
      onCancel={(event) => { event.preventDefault(); if (!ocupado) onCerrar() }}>
      <header className="editor-partida__head">
        <h2 id={titulo}>Recuperar contraseña</h2>
        <button type="button" className="editor-partida__icon" aria-label="Cerrar" disabled={ocupado} onClick={onCerrar}>
          <i className="mdi mdi-close" aria-hidden="true" />
        </button>
      </header>
      {formulario}
    </dialog>
  )
}
