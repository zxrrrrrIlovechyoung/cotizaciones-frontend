import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import AlertaExito from '@/components/AlertaExito'
import AppHeader from '@/components/AppHeader'
import IconoConfiguracion from '@/components/configuracion/IconoConfiguracion'
import LogoDocumento from '@/components/configuracion/LogoDocumento'
import HojaDocumento from '@/components/cotizaciones/HojaDocumento'
import {
  COLOR_DOCUMENTO_PREDETERMINADO, CONFIGURACION_DOCUMENTO_PREDETERMINADA, FUENTES_DOCUMENTO,
  esColorDocumento, esFuenteDocumento, guardarConfiguracionDocumento, obtenerConfiguracionDocumento,
  type ConfiguracionDocumento,
} from '@/services/configuracionDocumento'
import { documentoEjemplo, obtenerEmisor, type EmisorDocumento } from '@/services/documentoCotizacion'
import { useAuth } from '@/stores/auth'

export default function DocumentoConfiguracionView() {
  const { user } = useAuth()
  const nombre = user?.nombre ?? 'Tu cuenta'
  const [emisor, setEmisor] = useState<EmisorDocumento | null>(null)
  const [logoBorrador, setLogoBorrador] = useState<string | null>(null)
  const [errorEmisor, setErrorEmisor] = useState(false)
  const [configuracionGuardada, setConfiguracionGuardada] = useState<ConfiguracionDocumento | null>(null)
  const [color, setColor] = useState(COLOR_DOCUMENTO_PREDETERMINADO)
  const [fuente, setFuente] = useState(CONFIGURACION_DOCUMENTO_PREDETERMINADA.fuente)
  const [guardando, setGuardando] = useState(false)
  const [errorApariencia, setErrorApariencia] = useState('')
  const [aparienciaGuardada, setAparienciaGuardada] = useState(false)
  const cerrarConfirmacion = useCallback(() => setAparienciaGuardada(false), [])
  const valido = esColorDocumento(color)
  const colorPreview = valido ? color.toLowerCase() : configuracionGuardada?.color ?? COLOR_DOCUMENTO_PREDETERMINADO
  const hayCambios = configuracionGuardada && (colorPreview !== configuracionGuardada.color || fuente !== configuracionGuardada.fuente)
  const html = useMemo(() => documentoEjemplo({
    ...emisor, comercial: emisor?.comercial ?? nombre, logo: logoBorrador ?? emisor?.logo,
  }, nombre, { color: colorPreview, fuente }), [emisor, nombre, colorPreview, fuente, logoBorrador])

  useEffect(() => {
    const controller = new AbortController()
    obtenerConfiguracionDocumento(controller.signal).then((valor) => {
      if (controller.signal.aborted) return
      setConfiguracionGuardada(valor)
      setColor(valor.color)
      setFuente(valor.fuente)
    }).catch(() => {
      if (!controller.signal.aborted) setErrorApariencia('No se pudo cargar la configuración del documento.')
    })
    obtenerEmisor(nombre, controller.signal).then((datos) => {
      if (!controller.signal.aborted) setEmisor(datos)
    }).catch(() => {
      if (!controller.signal.aborted) setErrorEmisor(true)
    })
    return () => controller.abort()
  }, [nombre])

  function cambiarColor(valor: string) {
    setColor(valor)
    setErrorApariencia('')
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valido || !hayCambios || guardando) return
    setGuardando(true)
    setErrorApariencia('')
    try {
      const valor = await guardarConfiguracionDocumento({ color: colorPreview, fuente })
      setConfiguracionGuardada(valor)
      setColor(valor.color)
      setFuente(valor.fuente)
      setAparienciaGuardada(true)
    } catch {
      setErrorApariencia('No se pudo guardar la apariencia. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="ws configuracion__vista">
      <div className="ws__head ws__head--sinAccion">
        <Link className="topbar__back" to="/configuracion" aria-label="Volver a Configuración" viewTransition>
          <IconoConfiguracion icono="volver" />
        </Link>
        <div className="ws__titles"><h2>Personalizar documento</h2><p>Ajusta la apariencia de tus cotizaciones.</p></div>
        <AppHeader integrado mostrarCrearCotizacion={false} />
      </div>
      <div className="ws__body documento-config">
        <div className="documento-config__ajustes">
          <section className="cuenta__card" aria-labelledby="documento-apariencia">
            <header className="cuenta__encabezado">
              <IconoConfiguracion icono="documento" />
              <div><h3 id="documento-apariencia">Apariencia</h3><p>Elige el color y la fuente del documento.</p></div>
            </header>
            <form className="cuenta__form" onSubmit={guardar}>
              <div className="documento-config__color">
                <label className="cuenta__field">
                  <span>Color principal</span>
                  <input type="color" value={colorPreview} disabled={!configuracionGuardada || guardando}
                    onChange={(event) => cambiarColor(event.target.value)} />
                </label>
                <label className="cuenta__field">
                  <span>Código HEX</span>
                  <input className="ui-input" value={color.toUpperCase()} maxLength={7} placeholder="#1B4ED8"
                    disabled={!configuracionGuardada || guardando} aria-invalid={!valido} spellCheck={false}
                    onChange={(event) => cambiarColor(event.target.value)} />
                </label>
              </div>
              {!valido && <p className="campo__error" role="status">Ingresa un color como #1B4ED8.</p>}
              <label className="cuenta__field">
                <span>Fuente del documento</span>
                <select className="ui-select" value={fuente} disabled={!configuracionGuardada || guardando}
                  onChange={(event) => {
                    if (!esFuenteDocumento(event.target.value)) return
                    setFuente(event.target.value)
                    setErrorApariencia('')
                  }}>
                  {Object.entries(FUENTES_DOCUMENTO).map(([clave, datos]) => <option key={clave} value={clave}>{datos.nombre}</option>)}
                </select>
              </label>
              <div className="documento-config__acciones">
                <button type="submit" className="ui-btn ui-btn--primary" aria-busy={guardando}
                  disabled={!valido || !hayCambios || guardando}>
                  {guardando ? <><span className="spinner" aria-hidden="true" /> Guardando…</> : 'Guardar cambios'}
                </button>
                <button type="button" className="ui-btn" disabled={!configuracionGuardada || guardando || color.toLowerCase() === COLOR_DOCUMENTO_PREDETERMINADO}
                  onClick={() => cambiarColor(COLOR_DOCUMENTO_PREDETERMINADO)}>Restaurar azul</button>
              </div>
              {errorApariencia && <div className="cuenta__aviso is-error" role="alert">{errorApariencia}</div>}
            </form>
          </section>
          {emisor ? <LogoDocumento logo={emisor.logo} disponible={Boolean(emisor.perfilRegistrado)} onPreview={setLogoBorrador}
            onGuardado={(logo) => setEmisor((anterior) => anterior && { ...anterior, logo })} />
            : <p className="configuracion__ayuda" role="status">{errorEmisor ? 'No se pudo cargar el logo comercial.' : 'Cargando logo comercial…'}</p>}
        </div>
        <section className="cuenta__card documento-config__muestra" aria-labelledby="documento-muestra">
          <header className="cuenta__encabezado">
            <div><h3 id="documento-muestra">Vista previa</h3><p>Cotización de ejemplo en tamaño carta.</p></div>
          </header>
          <div className="documento-config__hoja">
            <HojaDocumento html={html} titulo="Vista previa del documento de cotización" />
          </div>
        </section>
      </div>
      {aparienciaGuardada && <AlertaExito titulo="Apariencia actualizada"
        mensaje="Los cambios del documento de cotización se guardaron correctamente."
        accion="Aceptar" onContinuar={cerrarConfirmacion} />}
    </div>
  )
}
