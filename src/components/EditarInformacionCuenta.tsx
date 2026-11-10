import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import axios from 'axios'

import { formatearFechaEdicion, obtenerEstadoNombre, type EstadoNombreUsuario } from '@/services/perfilCuenta'
import { useAuth } from '@/stores/auth'

export default function EditarInformacionCuenta({ onCerrar, onGuardado }: {
  onCerrar: () => void
  onGuardado: (nombre: string) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titulo = useId()
  const ayuda = useId()
  const { actualizarNombreUsuario } = useAuth()
  const [estado, setEstado] = useState<EstadoNombreUsuario | null>(null)
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const longitud = Array.from(nombre.trim()).length
  const puedeGuardar = estado?.puedeEditar && nombre.trim() !== estado.nombre && longitud >= 2 && longitud <= 60 && !guardando

  useEffect(() => {
    const node = dialog.current
    const controller = new AbortController()
    node?.showModal()
    obtenerEstadoNombre(controller.signal).then((datos) => {
      if (controller.signal.aborted) return
      setEstado(datos)
      setNombre(datos.nombre)
    }).catch(() => {
      if (!controller.signal.aborted) setError('No se pudo consultar si puedes cambiar tu nombre. Cierra el editor y vuelve a intentarlo.')
    })
    return () => {
      controller.abort()
      node?.close()
    }
  }, [])

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!puedeGuardar) return
    setGuardando(true)
    setError('')
    try {
      onGuardado(await actualizarNombreUsuario(nombre.trim()))
    } catch (error) {
      if (axios.isAxiosError<EstadoNombreUsuario>(error) && error.response?.status === 409) {
        const datos = error.response.data
        setEstado(datos)
        setNombre(datos.nombre)
      } else {
        setError('No se pudo guardar el nombre. Intenta de nuevo.')
      }
    } finally {
      setGuardando(false)
    }
  }

  const fecha = estado?.disponibleDesde && !estado.puedeEditar ? formatearFechaEdicion(estado.disponibleDesde) : null

  return (
    <dialog ref={dialog} className="editor-partida" aria-labelledby={titulo} aria-describedby={ayuda}
      onCancel={(event) => { event.preventDefault(); if (!guardando) onCerrar() }}>
      <header className="editor-partida__head">
        <h2 id={titulo}>Editar información de la cuenta</h2>
        <button type="button" className="editor-partida__icon" aria-label="Cerrar editor" disabled={guardando} onClick={onCerrar}>
          <i className="mdi mdi-close" aria-hidden="true" />
        </button>
      </header>
      <form onSubmit={guardar}>
        <div className="editor-partida__body cuenta__form">
          <label className="cuenta__field">
            <span>Nombre de usuario</span>
            <input className="ui-input" type="text" autoComplete="name" value={nombre}
              disabled={!estado?.puedeEditar || guardando} required minLength={2} maxLength={60}
              onChange={(event) => { setNombre(event.target.value); setError('') }} />
          </label>
          <p id={ayuda} className="cuenta__nota">
            {fecha ? <>Podrás volver a cambiar tu nombre el <strong>{fecha}</strong> (hora de Ciudad de México).</>
              : 'Puedes cambiar tu nombre una vez cada 60 días.'}
          </p>
          {!estado && !error && <p className="cuenta__nota" role="status">Consultando disponibilidad…</p>}
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
