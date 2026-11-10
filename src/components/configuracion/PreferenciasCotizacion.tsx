import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'

import AlertaExito from '@/components/AlertaExito'
import { guardarPreferenciasCotizacion, obtenerPreferenciasCotizacion, type PreferenciasCotizacion as Preferencias } from '@/services/preferenciasCotizacion'

export default function PreferenciasCotizacion() {
  const [base, setBase] = useState<Preferencias | null>(null)
  const [moneda, setMoneda] = useState<Preferencias['moneda']>('MXN')
  const [vigencia, setVigencia] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [confirmacion, setConfirmacion] = useState(false)
  const cerrarConfirmacion = useCallback(() => setConfirmacion(false), [])
  const dias = vigencia === '' ? null : Number(vigencia)
  const vigenciaValida = dias === null || (Number.isInteger(dias) && dias >= 1 && dias <= 365)
  const cambio = base && (base.moneda !== moneda || base.vigenciaDias !== dias)

  useEffect(() => {
    const controller = new AbortController()
    obtenerPreferenciasCotizacion(controller.signal).then((datos) => {
      if (controller.signal.aborted) return
      setBase(datos)
      setMoneda(datos.moneda)
      setVigencia(datos.vigenciaDias?.toString() ?? '')
    }).catch(() => {
      if (!controller.signal.aborted) setError('No se pudieron cargar las preferencias.')
    })
    return () => controller.abort()
  }, [])

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!vigenciaValida || !cambio || guardando) return
    setGuardando(true)
    setError('')
    try {
      const datos = await guardarPreferenciasCotizacion({ moneda, vigenciaDias: dias })
      setBase(datos)
      setMoneda(datos.moneda)
      setVigencia(datos.vigenciaDias?.toString() ?? '')
      setConfirmacion(true)
    } catch {
      setError('No se pudieron guardar las preferencias. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="cuenta__form" onSubmit={guardar}>
      <p className="configuracion__ayuda">Valores iniciales que puedes ajustar en cada cotización.</p>
      <label className="cuenta__field">
        <span>Moneda predeterminada</span>
        <select className="ui-select" value={moneda} disabled={!base || guardando}
          onChange={(event) => { setMoneda(event.target.value === 'USD' ? 'USD' : 'MXN'); setError('') }}>
          <option value="MXN">MXN · Peso mexicano</option>
          <option value="USD">USD · Dólar estadounidense</option>
        </select>
      </label>
      <label className="cuenta__field">
        <span>Vigencia predeterminada (días)</span>
        <input className="ui-input" type="text" inputMode="numeric" maxLength={3} placeholder="Definir en cada cotización"
          value={vigencia} disabled={!base || guardando} aria-invalid={!vigenciaValida}
          onChange={(event) => {
            const valor = event.target.value
            if (!/^\d{0,3}$/.test(valor)) return
            setVigencia(valor)
            setError('')
          }} />
        {!vigenciaValida && <small className="campo__error">Ingresa entre 1 y 365 días.</small>}
      </label>
      <button className="ui-btn ui-btn--primary" type="submit" disabled={!vigenciaValida || !cambio || guardando} aria-busy={guardando}>
        {guardando ? <><span className="spinner" aria-hidden="true" /> Guardando…</> : 'Guardar preferencias'}
      </button>
      {error && <div className="cuenta__aviso is-error" role="alert">{error}</div>}
      {confirmacion && createPortal(<AlertaExito titulo="Preferencias guardadas"
        mensaje="La moneda y la vigencia se aplicarán al crear nuevas cotizaciones."
        accion="Aceptar" onContinuar={cerrarConfirmacion} />, document.body)}
    </form>
  )
}
