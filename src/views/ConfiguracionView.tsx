import { useCallback, useEffect, useId, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useOutletContext } from 'react-router-dom'

import AlertaExito from '@/components/AlertaExito'
import AppHeader from '@/components/AppHeader'
import IconoConfiguracion from '@/components/configuracion/IconoConfiguracion'
import PreferenciasCotizacion from '@/components/configuracion/PreferenciasCotizacion'
import { guardarDiasAlerta, obtenerDiasAlerta } from '@/services/alertas'

function OpcionConfiguracion({ titulo, icono, abierta, onAlternar, children }: {
  titulo: string
  icono: ComponentProps<typeof IconoConfiguracion>['icono']
  abierta: boolean
  onAlternar: () => void
  children: ReactNode
}) {
  const id = useId()

  return (
    <li>
      <button className="configuracion__opcion" type="button" aria-expanded={abierta} aria-controls={id} onClick={onAlternar}>
        <IconoConfiguracion icono={icono} />
        <span className="configuracion__opcionTitulo">{titulo}</span>
        <IconoConfiguracion icono="flecha" className="configuracion__flecha" />
      </button>
      <div id={id} className="configuracion__contenido" hidden={!abierta}>{children}</div>
    </li>
  )
}

export default function ConfiguracionView() {
  const actualizarAlertas = useOutletContext<() => void>()
  const [opcionAbierta, setOpcionAbierta] = useState<'preferencias' | 'alertas' | null>(null)
  const [diasGuardados, setDiasGuardados] = useState<number | null>(null)
  const [dias, setDias] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmacion, setConfirmacion] = useState(false)
  const cerrarConfirmacion = useCallback(() => setConfirmacion(false), [])
  const diasNumero = Number(dias)
  const diasValidos = /^\d{1,3}$/.test(dias) && diasNumero <= 365
  const diasInvalidos = diasGuardados !== null && !diasValidos

  useEffect(() => {
    const controller = new AbortController()
    obtenerDiasAlerta(controller.signal).then((valor) => {
      if (controller.signal.aborted) return
      setDiasGuardados(valor)
      setDias(String(valor))
    }).catch(() => {
      if (!controller.signal.aborted) setError('No se pudo cargar la configuración de alertas.')
    })
    return () => controller.abort()
  }, [])

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!diasValidos || diasGuardados === null || diasNumero === diasGuardados || guardando) return
    setGuardando(true)
    setError('')
    try {
      const valor = await guardarDiasAlerta(diasNumero)
      setDiasGuardados(valor)
      setDias(String(valor))
      actualizarAlertas()
      setConfirmacion(true)
    } catch {
      setError('No se pudo guardar la configuración. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  function alternar(opcion: NonNullable<typeof opcionAbierta>) {
    setOpcionAbierta((actual) => actual === opcion ? null : opcion)
  }

  return (
    <div className="ws configuracion__vista">
      <div className="ws__head ws__head--sinAccion">
        <div className="ws__titles"><h2>Configuración</h2><p>Preferencias de cotización y seguridad de tu cuenta</p></div>
        <AppHeader integrado mostrarCrearCotizacion={false} />
      </div>
      <div className="ws__body configuracion">
        <section className="configuracion__seccion" aria-labelledby="config-cotizaciones">
          <h3 id="config-cotizaciones">Cotizaciones</h3>
          <ul className="configuracion__lista">
            <li>
              <Link className="configuracion__opcion" to="/configuracion/documento" viewTransition>
                <IconoConfiguracion icono="documento" />
                <span className="configuracion__opcionTitulo">Personalizar documento de cotización</span>
                <IconoConfiguracion icono="siguiente" className="configuracion__flecha" />
              </Link>
            </li>
            <OpcionConfiguracion titulo="Nuevas cotizaciones" icono="preferencias"
              abierta={opcionAbierta === 'preferencias'} onAlternar={() => alternar('preferencias')}>
              <PreferenciasCotizacion />
            </OpcionConfiguracion>
            <OpcionConfiguracion titulo="Alertas de vencimiento" icono="alertas"
              abierta={opcionAbierta === 'alertas'} onAlternar={() => alternar('alertas')}>
              <form className="cuenta__form" onSubmit={guardar}>
                <label className="cuenta__field">
                  <span>Días de anticipación</span>
                  <input className="ui-input" type="text" inputMode="numeric" maxLength={3} required
                    value={dias} disabled={diasGuardados === null || guardando} aria-invalid={diasInvalidos}
                    aria-describedby={diasInvalidos ? 'dias-alerta-ayuda dias-alerta-error' : 'dias-alerta-ayuda'}
                    onChange={(event) => {
                      const valor = event.target.value
                      if (!/^\d{0,3}$/.test(valor)) return
                      setDias(valor)
                      setError('')
                    }} />
                  {diasInvalidos && <small id="dias-alerta-error" className="campo__error">Ingresa entre 0 y 365 días.</small>}
                </label>
                <p id="dias-alerta-ayuda" className="configuracion__ayuda">Con 0 días, solo verás las cotizaciones que vencen hoy.</p>
                <button className="ui-btn ui-btn--primary" type="submit" aria-busy={guardando}
                  disabled={!diasValidos || diasGuardados === null || diasNumero === diasGuardados || guardando}>
                  {guardando ? <><span className="spinner" aria-hidden="true" /> Guardando…</> : 'Guardar cambios'}
                </button>
                {error && <div className="cuenta__aviso is-error" role="alert">{error}</div>}
              </form>
            </OpcionConfiguracion>
          </ul>
        </section>

        <section className="configuracion__seccion" aria-labelledby="config-cuenta">
          <h3 id="config-cuenta">Cuenta</h3>
          <ul className="configuracion__lista">
            <li>
              <Link className="configuracion__opcion" to="/configuracion/seguridad" viewTransition>
                <IconoConfiguracion icono="seguridad" />
                <span className="configuracion__opcionTitulo">Contraseña y sesión</span>
                <IconoConfiguracion icono="siguiente" className="configuracion__flecha" />
              </Link>
            </li>
          </ul>
        </section>
      </div>
      {confirmacion && createPortal(<AlertaExito titulo="Alertas guardadas"
        mensaje="Se actualizó la anticipación de las alertas de vencimiento."
        accion="Aceptar" onContinuar={cerrarConfirmacion} />, document.body)}
    </div>
  )
}
