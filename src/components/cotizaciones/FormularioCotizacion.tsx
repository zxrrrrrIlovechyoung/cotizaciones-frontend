import { useEffect, useLayoutEffect, useState } from 'react'
import axios from 'axios'

import CampoForm from './CampoForm'
import PrevisualizarDocumento from './PrevisualizarDocumento'
import { useAuth } from '@/stores/auth'
import { SelectorImagenPartida } from './ImagenPartida'
import ResumenTotales from './ResumenTotales'
import {
  type Cotizacion,
  type CotizacionForm,
  type PartidaForm,
  MAX_PARTIDAS,
  TIPOS_CLIENTE,
  UNIDADES,
  formatTel,
  formularioVacio,
  partidaVacia,
  capitalizar,
} from '@/data/cotizaciones'
import { type ClienteRegistrado } from '@/data/clientes'
import { crearCotizacion, MAX_IMAGENES_COTIZACION } from '@/services/cotizaciones'
import { listarClientes } from '@/services/clientes'
import { obtenerPreferenciasCotizacion } from '@/services/preferenciasCotizacion'

const precioValido = (valor: number | string) => /^\d{1,7}(?:\.\d{0,2})?$/.test(String(valor)) && Number(valor) >= 0.01
const errorPrecioVenta = (partida: PartidaForm) =>
  precioValido(partida.precioUnitarioCompra) && precioValido(partida.precioUnitarioVenta) &&
  Number(partida.precioUnitarioVenta) < Number(partida.precioUnitarioCompra)
    ? 'El precio de venta no puede ser menor al costo.'
    : undefined
const porcentajeValido = (valor: number | string) => /^\d{1,3}(?:\.\d{0,2})?$/.test(String(valor)) && Number(valor) <= 100

const camposNumericos = new Set(['cantidad', 'precioUnitarioCompra', 'precioUnitarioVenta', 'porcentajeDescuento', 'porcentajeIva', 'porcentajeAnticipo'])
function datosComparables(form: CotizacionForm) {
  return JSON.stringify(form, (key, value: unknown) => {
    if (key === 'imagenes') return undefined
    if (key === 'porcentajeAnticipo' && value === '') return null
    return camposNumericos.has(key) && value !== '' ? Number(value) : value
  })
}

function hayCambios(actual: CotizacionForm, base: CotizacionForm) {
  if (datosComparables(actual) !== datosComparables(base)) return true
  return actual.partidas.some((p, i) =>
    ([0, 1] as const).some((slot) => (p.imagenes?.[slot] ?? null) !== (base.partidas[i]?.imagenes?.[slot] ?? null)))
}

interface FormularioCotizacionProps {
  onVolver: () => void
  onGuardado: (cotizacion: Cotizacion) => void
  onEstadoEdicion: (estado: { modificado: boolean; guardando: boolean }) => void
  previsualizar: boolean
  onCerrarPreview: () => void
  inicial?: CotizacionForm
  editandoId?: number
}

const fechaMexico = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' })

export default function FormularioCotizacion(props: FormularioCotizacionProps) {
  const [plantilla, setPlantilla] = useState<CotizacionForm | null>(null)

  useEffect(() => {
    if (props.inicial) return
    const controller = new AbortController()
    obtenerPreferenciasCotizacion(controller.signal).then(({ moneda, vigenciaDias }) => {
      if (controller.signal.aborted) return
      let vigenciaHasta = ''
      if (vigenciaDias !== null) {
        const fecha = new Date(`${fechaMexico.format(new Date())}T00:00:00Z`)
        fecha.setUTCDate(fecha.getUTCDate() + vigenciaDias)
        vigenciaHasta = fecha.toISOString().slice(0, 10)
      }
      setPlantilla({ ...formularioVacio(), moneda, vigenciaHasta })
    }).catch(() => {
      if (!controller.signal.aborted) setPlantilla(formularioVacio())
    })
    return () => controller.abort()
  }, [props.inicial])

  const inicial = props.inicial ?? plantilla
  if (!inicial) return <p className="documento-error" role="status">Cargando formulario…</p>
  return <CamposCotizacion {...props} inicial={inicial} />
}

function CamposCotizacion({ onVolver, onGuardado, onEstadoEdicion, previsualizar, onCerrarPreview, inicial, editandoId }: FormularioCotizacionProps & { inicial: CotizacionForm }) {
  const { user } = useAuth()
  const [baseFormulario] = useState(inicial)
  const [formulario, setFormulario] = useState(baseFormulario)
  const modificado = hayCambios(formulario, baseFormulario)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  useLayoutEffect(() => {
    onEstadoEdicion({ modificado, guardando })
  }, [modificado, guardando, onEstadoEdicion])
  const [errorGuardar, setErrorGuardar] = useState('')
  const [ligarCliente, setLigarCliente] = useState(false)
  const [clienteBusqueda, setClienteBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteRegistrado | null>(null)
  const [clientes, setClientes] = useState<ClienteRegistrado[]>([])
  const hoy = fechaMexico.format(new Date())
  const identidadBloqueada = Boolean(clienteSeleccionado)
  const errorCorreo = formulario.correoContacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correoContacto)
    ? 'Ingresa un correo válido'
    : undefined

  // Clientes reales desde la API (para el buscador "Ligar a cliente registrado").
  // Si falla, el buscador simplemente no sugiere y el cliente se captura a mano.
  useEffect(() => {
    let activo = true
    listarClientes()
      .then((datos) => activo && setClientes(datos))
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  const sugeridos = ligarCliente && clienteBusqueda.trim() && !clienteSeleccionado
    ? clientes.filter((c) => {
        const q = clienteBusqueda.trim().toLowerCase()
        return String(c.idCliente).includes(q) || c.nombreComercial.toLowerCase().includes(q) || c.rfc.toLowerCase().includes(q) || c.correoContacto.toLowerCase().includes(q) || c.telefonoContacto.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      }).slice(0, 6)
    : []
  function update(campo: keyof typeof formulario, valor: unknown) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function actualizarPorcentaje(campo: 'porcentajeIva' | 'porcentajeAnticipo', valor: string) {
    const decimal = valor.replace(',', '.')
    if (decimal === '' || porcentajeValido(decimal)) update(campo, decimal)
  }

  function updatePartida(index: number, campo: keyof (typeof formulario.partidas)[number], valor: unknown) {
    setFormulario((actual) => ({ ...actual, partidas: actual.partidas.map((p, i) => i === index ? { ...p, [campo]: valor } : p) }))
    if (campo === 'precioUnitarioCompra' || campo === 'precioUnitarioVenta') {
      setErrores((actual) => ({ ...actual, [`partidas.${index}.${campo}`]: '', [`partidas.${index}.precioUnitarioVenta`]: '' }))
    }
  }

  function seleccionarCliente(c: ClienteRegistrado) {
    setClienteSeleccionado(c)
    setClienteBusqueda('')
    setFormulario((actual) => ({ ...actual, idCliente: c.idCliente, tipoCliente: c.tipoCliente, nombreComercial: c.nombreComercial, atencionA: c.atencionA, rfc: c.rfc, correoContacto: c.correoContacto, telefonoContacto: c.telefonoContacto }))
    setErrores((actual) => ({ ...actual, clienteRegistrado: '' }))
  }

  function desvincularCliente() {
    setClienteSeleccionado(null)
    setFormulario((actual) => ({ ...actual, idCliente: null }))
  }

  function validarPaso0() {
    const next: Record<string, string> = {}
    if (ligarCliente && !formulario.idCliente) next.clienteRegistrado = 'Busca y selecciona un cliente de la lista, o desactiva la búsqueda para capturarlo manualmente.'
    if (!formulario.nombreComercial.trim()) next.nombreComercial = 'El nombre de la empresa es obligatorio para continuar.'
    if (!formulario.atencionA.trim()) next.atencionA = 'Indica a quién va dirigida la cotización.'
    if (formulario.telefonoContacto.replace(/\D/g, '').length < 10) next.telefonoContacto = 'Ingresa un teléfono válido de 10 dígitos.'
    if (!formulario.vigenciaHasta) next.vigenciaHasta = 'Indica la fecha de vigencia de la cotización.'
    else if (formulario.vigenciaHasta < hoy && (!editandoId || formulario.vigenciaHasta !== inicial.vigenciaHasta)) next.vigenciaHasta = 'La fecha de vigencia no puede ser anterior a hoy.'
    if (errorCorreo) next.correoContacto = errorCorreo
    setErrores(next)
    return Object.keys(next).length === 0
  }

  function validarPaso1() {
    const next: Record<string, string> = {}
    formulario.partidas.forEach((p, i) => {
      const pre = `partidas.${i}.`
      const num = i + 1
      if (!p.descripcion.trim()) next[`${pre}descripcion`] = `Partida ${num}: escribe el producto o servicio.`
      if (!/^\d{1,5}$/.test(String(p.cantidad)) || Number(p.cantidad) < 1) next[`${pre}cantidad`] = `Partida ${num}: ingresa una cantidad entera de 1 a 99,999.`
      if (!precioValido(p.precioUnitarioCompra)) next[`${pre}precioUnitarioCompra`] = `Partida ${num}: costo de 0.01 a 9,999,999.99.`
      if (!precioValido(p.precioUnitarioVenta)) next[`${pre}precioUnitarioVenta`] = `Partida ${num}: precio de 0.01 a 9,999,999.99.`
      else {
        const error = errorPrecioVenta(p)
        if (error) next[`${pre}precioUnitarioVenta`] = error
      }
    })
    setErrores(next)
    return Object.keys(next).length === 0
  }

  function validarPaso2() {
    const next: Record<string, string> = {}
    if (!porcentajeValido(formulario.porcentajeIva)) next.porcentajeIva = 'Entre 0 y 100%, con hasta dos decimales.'
    if (formulario.porcentajeAnticipo !== '' && !porcentajeValido(formulario.porcentajeAnticipo)) next.porcentajeAnticipo = 'Entre 0 y 100%, con hasta dos decimales.'
    if (Array.from(formulario.tiempoEntrega).length > 100) next.tiempoEntrega = 'Máximo 100 caracteres.'
    if (Array.from(formulario.condicionesPago).length > 100) next.condicionesPago = 'Máximo 100 caracteres.'
    if (Array.from(formulario.notasComerciales).length > 100) next.notasComerciales = 'Máximo 100 caracteres.'
    if (!formulario.tiempoEntrega.trim()) next.tiempoEntrega = 'Indica el plazo estimado de entrega.'
    if (!formulario.condicionesPago.trim()) next.condicionesPago = 'Escribe al menos una condición de pago.'
    if (!formulario.metodosPago.trim()) next.metodosPago = 'Método de pago obligatorio.'
    if (Array.from(formulario.metodosPago).length > 100) next.metodosPago = 'Máximo 100 caracteres.'
    setErrores(next)
    return Object.keys(next).length === 0
  }

  async function guardar() {
    if (guardando || !modificado) return
    if (!validarPaso0()) return
    if (!validarPaso1()) return
    if (!validarPaso2()) return
    const totalImagenes = formulario.partidas.reduce((total, p) => total + (p.imagenes?.reduce((size, file) => size + (file?.size ?? 0), 0) ?? 0), 0)
    if (totalImagenes > MAX_IMAGENES_COTIZACION) {
      setErrorGuardar('Las imágenes de la cotización no pueden superar 15 MB en total.')
      return
    }
    setGuardando(true)
    setErrorGuardar('')
    try {
      const cotizacion = await crearCotizacion(formulario, editandoId)
      onGuardado(cotizacion)
    } catch (error) {
      setErrorGuardar(axios.isAxiosError(error) && (error.response?.status === 400 || error.response?.status === 409) && typeof error.response.data?.error === 'string'
        ? error.response.data.error
        : 'No se pudo guardar la cotización. Intenta de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className={editandoId ? 'form' : 'form form--nueva-cotizacion'} noValidate onSubmit={(e) => e.preventDefault()}>
      <div className="form__layout"><div className="form__col">
        <section className="panel form-section"><div className="panel__titulo"><i className="mdi mdi-office-building-outline" /><span>¿A quién va dirigida la cotización?</span></div><div className="ligar"><div className="ligar__cabecera"><div><div className="ligar__label">Ligar a cliente registrado</div><div className="ligar__ayuda">{ligarCliente ? 'Busca y selecciona un cliente existente.' : 'Activa esta opción para buscar un cliente del sistema.'}</div></div><label className="ligar__check"><input checked={ligarCliente} type="checkbox" className="ui-check" onChange={(e) => { setLigarCliente(e.target.checked); if (!e.target.checked) { setClienteBusqueda(''); desvincularCliente() } }} />Buscar cliente</label></div>{errores.clienteRegistrado && <div className="ligar__error">{errores.clienteRegistrado}</div>}<div className={`buscador ${!ligarCliente ? 'is-off' : ''}`}><i className="mdi mdi-magnify" /><input value={clienteBusqueda} className="ui-input" disabled={!ligarCliente} placeholder={ligarCliente ? 'Buscar por código, nombre, RFC, correo o teléfono' : 'Activa Buscar cliente para habilitar la búsqueda'} onChange={(e) => setClienteBusqueda(e.target.value)} />{sugeridos.length > 0 && <div className="sugerencias">{sugeridos.map((c) => <button key={c.idCliente} type="button" className="sugerencia" onClick={() => seleccionarCliente(c)}><span className="sugerencia__info"><strong>{c.nombreComercial}</strong><span>Código {c.idCliente} · {c.tipoCliente} · {c.rfc} · {c.correoContacto}</span></span><i className="mdi mdi-chevron-right" /></button>)}</div>}</div>{clienteSeleccionado && <div className="ligado"><div className="ligado__info"><div className="ligado__id">Ligado a cliente #{clienteSeleccionado.idCliente}</div><div className="ligado__nombre">{clienteSeleccionado.nombreComercial}</div></div><button type="button" className="ligado__quitar" onClick={desvincularCliente}>Quitar liga</button></div>}</div><div className="grid grid--tipo"><CampoForm label="Tipo de cliente"><select value={formulario.tipoCliente} className="ui-select" disabled={identidadBloqueada} onChange={(e) => update('tipoCliente', e.target.value)}>{TIPOS_CLIENTE.map((t) => <option key={t}>{t}</option>)}</select></CampoForm><CampoForm label="Nombre de la empresa / cliente *" error={errores.nombreComercial}><input value={formulario.nombreComercial} className={`ui-input ${errores.nombreComercial ? 'is-error' : ''}`} disabled={identidadBloqueada} maxLength={45} onChange={(e) => update('nombreComercial', capitalizar(e.target.value))} /></CampoForm></div><div className="grid grid--2"><CampoForm label="Atención a *" error={errores.atencionA}><input value={formulario.atencionA} className={`ui-input ${errores.atencionA ? 'is-error' : ''}`} disabled={identidadBloqueada} maxLength={45} onChange={(e) => update('atencionA', capitalizar(e.target.value))} /></CampoForm><CampoForm label="RFC (opcional)"><input value={formulario.rfc} className="ui-input rfc" maxLength={13} onChange={(e) => update('rfc', e.target.value.toUpperCase().replace(/[^A-Z0-9&]/g, ''))} /></CampoForm></div><div className="grid grid--2"><CampoForm label="Correo electrónico (opcional)" error={errorCorreo}><input value={formulario.correoContacto} type="email" aria-invalid={Boolean(errorCorreo)} className={`ui-input ${errorCorreo ? 'is-error' : ''}`} maxLength={40} onChange={(e) => update('correoContacto', e.target.value)} /></CampoForm><CampoForm label="Teléfono *" error={errores.telefonoContacto}><input value={formulario.telefonoContacto} className={`ui-input ${errores.telefonoContacto ? 'is-error' : ''}`} inputMode="numeric" maxLength={12} onChange={(e) => update('telefonoContacto', formatTel(e.target.value))} /></CampoForm></div><CampoForm label="Cotización válida hasta *" error={errores.vigenciaHasta}><input value={formulario.vigenciaHasta} type="date" min={hoy} className={`ui-input fecha ${errores.vigenciaHasta ? 'is-error' : ''}`} onChange={(e) => update('vigenciaHasta', e.target.value)} /></CampoForm></section>
        <section className="productos form-section"><label className="iva"><input checked={formulario.preciosIncluyenIva} type="checkbox" className="ui-check" onChange={(e) => update('preciosIncluyenIva', e.target.checked)} />Los precios capturados ya incluyen IVA</label>{formulario.partidas.map((p, i) => <div className="tarjeta" key={i}><header className="tarjeta__head"><span className="tarjeta__num">{i + 1}</span><span className="tarjeta__nombre">{p.descripcion || `Partida ${i + 1}`}</span>{formulario.partidas.length > 1 && <button type="button" className="tarjeta__borrar" onClick={() => setFormulario((actual) => ({ ...actual, partidas: actual.partidas.filter((_, idx) => idx !== i) }))}><i className="mdi mdi-trash-can-outline" /></button>}</header><div className="tarjeta__cuerpo tarjeta__cuerpo--simple"><div className="partida-adjuntos" role="group" aria-label={`Imágenes de la partida ${i + 1}`}>{([0, 1] as const).map((slot) => <SelectorImagenPartida key={slot} slot={slot + 1} file={p.imagenes?.[slot] ?? null} disabled={guardando} onChange={(file) => { const imagenes: [File | null, File | null] = [...(p.imagenes ?? [null, null])]; imagenes[slot] = file; updatePartida(i, 'imagenes', imagenes) }} />)}</div><div className="grid grid--sku"><CampoForm label="SKU"><input value={p.sku} className="ui-input ui-input--sm" maxLength={30} onChange={(e) => updatePartida(i, 'sku', e.target.value.toUpperCase())} /></CampoForm><CampoForm label="Producto o servicio *" error={errores[`partidas.${i}.descripcion`]}><input value={p.descripcion} className={`ui-input ui-input--sm ${errores[`partidas.${i}.descripcion`] ? 'is-error' : ''}`} maxLength={100} onChange={(e) => updatePartida(i, 'descripcion', capitalizar(e.target.value))} /></CampoForm></div><div className="grid grid--precios"><CampoForm label="Cantidad *" error={errores[`partidas.${i}.cantidad`]}><input value={p.cantidad} type="text" inputMode="numeric" maxLength={5} aria-invalid={Boolean(errores[`partidas.${i}.cantidad`])} className={`ui-input ui-input--sm ${errores[`partidas.${i}.cantidad`] ? 'is-error' : ''}`} onChange={(e) => updatePartida(i, 'cantidad', e.target.value.replace(/\D/g, '').slice(0, 5))} /></CampoForm><CampoForm label="Unidad"><select value={p.unidad} className="ui-select ui-select--sm" onChange={(e) => updatePartida(i, 'unidad', e.target.value)}>{UNIDADES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select></CampoForm><CampoForm label="Costo compra / u. *" error={errores[`partidas.${i}.precioUnitarioCompra`]}><input value={p.precioUnitarioCompra} type="text" inputMode="decimal" maxLength={10} className={`ui-input ui-input--sm ${errores[`partidas.${i}.precioUnitarioCompra`] ? 'is-error' : ''}`} onChange={(e) => /^\d{0,7}(?:\.\d{0,2})?$/.test(e.target.value) && updatePartida(i, 'precioUnitarioCompra', e.target.value)} /></CampoForm><CampoForm label="Precio cliente / u. *" error={errorPrecioVenta(p) ?? errores[`partidas.${i}.precioUnitarioVenta`]}><input value={p.precioUnitarioVenta} aria-invalid={Boolean(errorPrecioVenta(p) || errores[`partidas.${i}.precioUnitarioVenta`])} type="text" inputMode="decimal" maxLength={10} className={`ui-input ui-input--sm ${(errorPrecioVenta(p) || errores[`partidas.${i}.precioUnitarioVenta`]) ? 'is-error' : ''}`} onChange={(e) => /^\d{0,7}(?:\.\d{0,2})?$/.test(e.target.value) && updatePartida(i, 'precioUnitarioVenta', e.target.value)} /></CampoForm></div></div></div>)}{formulario.partidas.length >= MAX_PARTIDAS ? <div className="tope">Llegaste al máximo de {MAX_PARTIDAS} partidas por cotización.</div> : <button type="button" className="agregar-partida" onClick={() => setFormulario((actual) => ({ ...actual, partidas: [...actual.partidas, partidaVacia()] }))}><i className="mdi mdi-plus" /> Agregar otra partida</button>}</section>
        <section className="panel form-section"><div className="panel__titulo"><span>Condiciones comerciales</span></div><div className="grid grid--3"><CampoForm label="Moneda"><select value={formulario.moneda} className="ui-select" onChange={(e) => update('moneda', e.target.value)}><option>MXN</option><option>USD</option></select></CampoForm><CampoForm label="IVA general %" error={errores.porcentajeIva}><input value={formulario.porcentajeIva} type="text" inputMode="decimal" maxLength={6} className={`ui-input ${errores.porcentajeIva ? 'is-error' : ''}`} onChange={(e) => actualizarPorcentaje('porcentajeIva', e.target.value)} /></CampoForm><CampoForm label="Anticipo requerido %" error={errores.porcentajeAnticipo}><input value={formulario.porcentajeAnticipo} type="text" inputMode="decimal" maxLength={6} className={`ui-input ${errores.porcentajeAnticipo ? 'is-error' : ''}`} onChange={(e) => actualizarPorcentaje('porcentajeAnticipo', e.target.value)} /></CampoForm></div><CampoForm label="Plazo estimado de entrega *" error={errores.tiempoEntrega}><input value={formulario.tiempoEntrega} className={`ui-input ${errores.tiempoEntrega ? 'is-error' : ''}`} maxLength={100} onChange={(e) => update('tiempoEntrega', capitalizar(e.target.value))} /></CampoForm><div className="grid grid--2"><CampoForm label="Condiciones de pago *" error={errores.condicionesPago}><textarea value={formulario.condicionesPago} maxLength={100} className={`ui-textarea ${errores.condicionesPago ? 'is-error' : ''}`} onChange={(e) => update('condicionesPago', capitalizar(e.target.value))} /></CampoForm><CampoForm label="Notas adicionales" error={errores.notasComerciales}><textarea value={formulario.notasComerciales} maxLength={100} className={`ui-textarea ${errores.notasComerciales ? 'is-error' : ''}`} onChange={(e) => update('notasComerciales', capitalizar(e.target.value))} /></CampoForm><CampoForm label="Métodos de pago *" error={errores.metodosPago}><textarea value={formulario.metodosPago} maxLength={100} className={`ui-textarea ${errores.metodosPago ? 'is-error' : ''}`} onChange={(e) => update('metodosPago', capitalizar(e.target.value))} /></CampoForm></div></section>
        {errorGuardar && <div className="form__error"><i className="mdi mdi-alert-circle-outline" /> {errorGuardar}</div>}
        <div className="nav"><button type="button" className="ui-btn" onClick={onVolver}>Cancelar</button><button type="button" className="ui-btn ui-btn--primary guardar" disabled={guardando || !modificado} onClick={guardar}>{guardando ? <span className="spinner" /> : <><i className="mdi mdi-check" /> {editandoId ? 'Guardar cambios' : 'Guardar cotización'}</>}</button></div>
      </div>
      {previsualizar && <PrevisualizarDocumento formulario={formulario} nombre={user?.nombre ?? ''} onClose={onCerrarPreview} />}
      <ResumenTotales formulario={formulario} /></div>
    </form>
  )
}
