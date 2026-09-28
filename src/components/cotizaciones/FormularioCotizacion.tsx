import { useState } from 'react'

import CampoForm from './CampoForm'
import ResumenTotales from './ResumenTotales'
import {
  MAX_PARTIDAS,
  TIPOS_CLIENTE,
  UNIDADES,
  formatTel,
  formularioVacio,
  partidaVacia,
  toTitleCase,
} from '@/data/cotizaciones'
import { CLIENTES, type ClienteRegistrado } from '@/data/clientes'

export default function FormularioCotizacion({ onVolver, onGuardado }: { onVolver: () => void; onGuardado: () => void }) {
  const [formulario, setFormulario] = useState(formularioVacio())
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [paso, setPaso] = useState(0)
  const [maxAlcanzado, setMaxAlcanzado] = useState(0)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [ligarCliente, setLigarCliente] = useState(false)
  const [clienteBusqueda, setClienteBusqueda] = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteRegistrado | null>(null)
  const hoy = new Date().toISOString().slice(0, 10)
  const identidadBloqueada = Boolean(clienteSeleccionado)
  const sugeridos = ligarCliente && clienteBusqueda.trim() && !clienteSeleccionado
    ? CLIENTES.filter((c) => {
        const q = clienteBusqueda.trim().toLowerCase()
        return String(c.idCliente).includes(q) || c.nombreComercial.toLowerCase().includes(q) || c.rfc.toLowerCase().includes(q) || c.correoContacto.toLowerCase().includes(q) || c.telefonoContacto.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      }).slice(0, 6)
    : []

  function update(campo: keyof typeof formulario, valor: unknown) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function updatePartida(index: number, campo: keyof (typeof formulario.partidas)[number], valor: unknown) {
    setFormulario((actual) => ({ ...actual, partidas: actual.partidas.map((p, i) => i === index ? { ...p, [campo]: valor } : p) }))
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
    else if (formulario.vigenciaHasta < hoy) next.vigenciaHasta = 'La fecha de vigencia no puede ser anterior a hoy.'
    if (formulario.correoContacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correoContacto)) next.correoContacto = 'Correo inválido, ej. ventas@empresa.com'
    setErrores(next)
    return Object.keys(next).length === 0
  }

  function validarPaso1() {
    const next: Record<string, string> = {}
    formulario.partidas.forEach((p, i) => {
      const pre = `partidas.${i}.`
      const num = i + 1
      if (!p.descripcion.trim()) next[`${pre}descripcion`] = `Partida ${num}: escribe el producto o servicio.`
      if (Number(p.cantidad) <= 0) next[`${pre}cantidad`] = `Partida ${num}: la cantidad debe ser mayor a cero.`
      if (Number(p.precioUnitarioCompra) <= 0) next[`${pre}precioUnitarioCompra`] = `Partida ${num}: indica el costo de compra.`
      if (Number(p.precioUnitarioVenta) <= 0) next[`${pre}precioUnitarioVenta`] = `Partida ${num}: indica el precio de venta.`
      else if (Number(p.precioUnitarioVenta) < Number(p.precioUnitarioCompra)) next[`${pre}precioUnitarioVenta`] = 'El precio de venta no puede ser menor al costo.'
    })
    setErrores(next)
    return Object.keys(next).length === 0
  }

  function validarPaso2() {
    const next: Record<string, string> = {}
    if (Number(formulario.porcentajeIva) < 0 || Number(formulario.porcentajeIva) > 100) next.porcentajeIva = 'Entre 0 y 100%.'
    if (!formulario.tiempoEntrega.trim()) next.tiempoEntrega = 'Indica el plazo estimado de entrega.'
    if (!formulario.condicionesPago.trim()) next.condicionesPago = 'Escribe al menos una condición de pago.'
    if (!formulario.metodosPago.trim()) next.metodosPago = 'Método de pago obligatorio.'
    setErrores(next)
    return Object.keys(next).length === 0
  }

  function siguiente() {
    if (paso === 0 && !validarPaso0()) return
    if (paso === 1 && !validarPaso1()) return
    const next = paso + 1
    setPaso(next)
    setMaxAlcanzado((actual) => Math.max(actual, next))
  }

  async function guardar() {
    if (guardando) return
    if (!validarPaso0()) return setPaso(0)
    if (!validarPaso1()) return setPaso(1)
    if (!validarPaso2()) return setPaso(2)
    setGuardando(true)
    await new Promise((r) => setTimeout(r, 700))
    setGuardando(false)
    setGuardado(true)
    setTimeout(onGuardado, 1200)
  }

  return (
    <form className="form" noValidate onSubmit={(e) => e.preventDefault()}>
      <header className="form__head"><button type="button" className="icon-btn" onClick={onVolver}><i className="mdi mdi-arrow-left" /></button><div><h2>Nueva cotización</h2><p>Refacciones, mano de obra y servicios de taller</p></div></header>
      <div className="pasos">{['Cliente', 'Productos', 'Condiciones'].map((nombre, i) => <span className="pasos__item" key={nombre}><button type="button" className={`paso ${i <= maxAlcanzado ? 'is-accesible' : ''}`} disabled={i > maxAlcanzado} onClick={() => { setErrores({}); setPaso(i) }}><span className={`paso__circulo ${i === paso ? 'is-activo' : ''} ${i < paso ? 'is-completado' : ''}`}>{i < paso ? '✓' : i + 1}</span><span className={`paso__nombre ${i === paso ? 'is-activo' : ''} ${i < paso ? 'is-completado' : ''}`}>{nombre}</span></button>{i < 2 && <span className={`linea ${i < paso ? 'is-completada' : ''}`} />}</span>)}</div>
      <div className="form__layout"><div className="form__col">
        {paso === 0 && <section className="panel"><div className="panel__titulo"><i className="mdi mdi-office-building-outline" /><span>¿A quién va dirigida la cotización?</span></div><div className="ligar"><div className="ligar__cabecera"><div><div className="ligar__label">Ligar a cliente registrado</div><div className="ligar__ayuda">{ligarCliente ? 'Busca y selecciona un cliente existente.' : 'Activa esta opción para buscar un cliente del sistema.'}</div></div><label className="ligar__check"><input checked={ligarCliente} type="checkbox" className="ui-check" onChange={(e) => { setLigarCliente(e.target.checked); if (!e.target.checked) { setClienteBusqueda(''); desvincularCliente() } }} />Buscar cliente</label></div>{errores.clienteRegistrado && <div className="ligar__error">{errores.clienteRegistrado}</div>}<div className={`buscador ${!ligarCliente ? 'is-off' : ''}`}><i className="mdi mdi-magnify" /><input value={clienteBusqueda} className="ui-input" disabled={!ligarCliente} placeholder={ligarCliente ? 'Buscar por código, nombre, RFC, correo o teléfono' : 'Activa Buscar cliente para habilitar la búsqueda'} onChange={(e) => setClienteBusqueda(e.target.value)} />{sugeridos.length > 0 && <div className="sugerencias">{sugeridos.map((c) => <button key={c.idCliente} type="button" className="sugerencia" onClick={() => seleccionarCliente(c)}><span className="sugerencia__info"><strong>{c.nombreComercial}</strong><span>Código {c.idCliente} · {c.tipoCliente} · {c.rfc} · {c.correoContacto}</span></span><i className="mdi mdi-chevron-right" /></button>)}</div>}</div>{clienteSeleccionado && <div className="ligado"><div className="ligado__info"><div className="ligado__id">Ligado a cliente #{clienteSeleccionado.idCliente}</div><div className="ligado__nombre">{clienteSeleccionado.nombreComercial}</div></div><button type="button" className="ligado__quitar" onClick={desvincularCliente}>Quitar liga</button></div>}</div><div className="grid grid--tipo"><CampoForm label="Tipo de cliente"><select value={formulario.tipoCliente} className="ui-select" disabled={identidadBloqueada} onChange={(e) => update('tipoCliente', e.target.value)}>{TIPOS_CLIENTE.map((t) => <option key={t}>{t}</option>)}</select></CampoForm><CampoForm label="Nombre de la empresa / cliente *" error={errores.nombreComercial}><input value={formulario.nombreComercial} className={`ui-input ${errores.nombreComercial ? 'is-error' : ''}`} disabled={identidadBloqueada} maxLength={45} onChange={(e) => update('nombreComercial', toTitleCase(e.target.value))} /></CampoForm></div><div className="grid grid--2"><CampoForm label="Atención a *" error={errores.atencionA}><input value={formulario.atencionA} className={`ui-input ${errores.atencionA ? 'is-error' : ''}`} disabled={identidadBloqueada} maxLength={45} onChange={(e) => update('atencionA', toTitleCase(e.target.value))} /></CampoForm><CampoForm label="RFC (opcional)"><input value={formulario.rfc} className="ui-input rfc" maxLength={13} onChange={(e) => update('rfc', e.target.value.toUpperCase().replace(/[^A-Z0-9&]/g, ''))} /></CampoForm></div><div className="grid grid--2"><CampoForm label="Correo electrónico (opcional)" error={errores.correoContacto}><input value={formulario.correoContacto} type="email" className={`ui-input ${errores.correoContacto ? 'is-error' : ''}`} maxLength={40} onChange={(e) => update('correoContacto', e.target.value)} /></CampoForm><CampoForm label="Teléfono *" error={errores.telefonoContacto}><input value={formulario.telefonoContacto} className={`ui-input ${errores.telefonoContacto ? 'is-error' : ''}`} inputMode="numeric" maxLength={12} onChange={(e) => update('telefonoContacto', formatTel(e.target.value))} /></CampoForm></div><CampoForm label="Cotización válida hasta *" error={errores.vigenciaHasta}><input value={formulario.vigenciaHasta} type="date" min={hoy} className={`ui-input fecha ${errores.vigenciaHasta ? 'is-error' : ''}`} onChange={(e) => update('vigenciaHasta', e.target.value)} /></CampoForm></section>}
        {paso === 1 && <section className="productos"><label className="iva"><input checked={formulario.preciosIncluyenIva} type="checkbox" className="ui-check" onChange={(e) => update('preciosIncluyenIva', e.target.checked)} />Los precios capturados ya incluyen IVA</label>{formulario.partidas.map((p, i) => <div className="tarjeta" key={i}><header className="tarjeta__head"><span className="tarjeta__num">{i + 1}</span><span className="tarjeta__nombre">{p.descripcion || `Partida ${i + 1}`}</span>{formulario.partidas.length > 1 && <button type="button" className="tarjeta__borrar" onClick={() => setFormulario((actual) => ({ ...actual, partidas: actual.partidas.filter((_, idx) => idx !== i) }))}><i className="mdi mdi-trash-can-outline" /></button>}</header><div className="tarjeta__cuerpo tarjeta__cuerpo--simple"><div className="grid grid--sku"><CampoForm label="SKU"><input value={p.sku} className="ui-input ui-input--sm" maxLength={30} onChange={(e) => updatePartida(i, 'sku', e.target.value.toUpperCase())} /></CampoForm><CampoForm label="Producto o servicio *" error={errores[`partidas.${i}.descripcion`]}><input value={p.descripcion} className={`ui-input ui-input--sm ${errores[`partidas.${i}.descripcion`] ? 'is-error' : ''}`} maxLength={100} onChange={(e) => updatePartida(i, 'descripcion', toTitleCase(e.target.value))} /></CampoForm></div><div className="grid grid--precios"><CampoForm label="Cantidad *" error={errores[`partidas.${i}.cantidad`]}><input value={p.cantidad} type="number" min="1" className={`ui-input ui-input--sm ${errores[`partidas.${i}.cantidad`] ? 'is-error' : ''}`} onChange={(e) => updatePartida(i, 'cantidad', e.target.value)} /></CampoForm><CampoForm label="Unidad"><select value={p.unidad} className="ui-select ui-select--sm" onChange={(e) => updatePartida(i, 'unidad', e.target.value)}>{UNIDADES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}</select></CampoForm><CampoForm label="Costo compra / u. *" error={errores[`partidas.${i}.precioUnitarioCompra`]}><input value={p.precioUnitarioCompra} type="text" inputMode="decimal" className={`ui-input ui-input--sm ${errores[`partidas.${i}.precioUnitarioCompra`] ? 'is-error' : ''}`} onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && updatePartida(i, 'precioUnitarioCompra', e.target.value)} /></CampoForm><CampoForm label="Precio cliente / u. *" error={errores[`partidas.${i}.precioUnitarioVenta`]}><input value={p.precioUnitarioVenta} type="text" inputMode="decimal" className={`ui-input ui-input--sm ${errores[`partidas.${i}.precioUnitarioVenta`] ? 'is-error' : ''}`} onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && updatePartida(i, 'precioUnitarioVenta', e.target.value)} /></CampoForm></div></div></div>)}{formulario.partidas.length >= MAX_PARTIDAS ? <div className="tope">Llegaste al máximo de {MAX_PARTIDAS} partidas por cotización.</div> : <button type="button" className="agregar-partida" onClick={() => setFormulario((actual) => ({ ...actual, partidas: [...actual.partidas, partidaVacia()] }))}><i className="mdi mdi-plus" /> Agregar otra partida</button>}</section>}
        {paso === 2 && <section className="panel"><div className="panel__titulo"><span>Condiciones comerciales</span></div><div className="grid grid--3"><CampoForm label="Moneda"><select value={formulario.moneda} className="ui-select" onChange={(e) => update('moneda', e.target.value)}><option>MXN</option><option>USD</option></select></CampoForm><CampoForm label="IVA general %" error={errores.porcentajeIva}><input value={formulario.porcentajeIva} type="number" min="0" max="100" className={`ui-input ${errores.porcentajeIva ? 'is-error' : ''}`} onChange={(e) => update('porcentajeIva', Number(e.target.value))} /></CampoForm><CampoForm label="Anticipo requerido %"><input value={formulario.porcentajeAnticipo} type="number" min="0" max="100" className="ui-input" onChange={(e) => update('porcentajeAnticipo', e.target.value === '' ? '' : Number(e.target.value))} /></CampoForm></div><CampoForm label="Plazo estimado de entrega *" error={errores.tiempoEntrega}><input value={formulario.tiempoEntrega} className={`ui-input ${errores.tiempoEntrega ? 'is-error' : ''}`} maxLength={100} onChange={(e) => update('tiempoEntrega', toTitleCase(e.target.value))} /></CampoForm><div className="grid grid--2"><CampoForm label="Condiciones de pago *" error={errores.condicionesPago}><textarea value={formulario.condicionesPago} className={`ui-textarea ${errores.condicionesPago ? 'is-error' : ''}`} onChange={(e) => update('condicionesPago', e.target.value)} /></CampoForm><CampoForm label="Notas adicionales"><textarea value={formulario.notasComerciales} className="ui-textarea" onChange={(e) => update('notasComerciales', e.target.value)} /></CampoForm><CampoForm label="Métodos de pago *" error={errores.metodosPago}><textarea value={formulario.metodosPago} className={`ui-textarea ${errores.metodosPago ? 'is-error' : ''}`} onChange={(e) => update('metodosPago', e.target.value)} /></CampoForm></div></section>}
        <div className="nav"><button type="button" className="ui-btn" onClick={paso > 0 ? () => setPaso(paso - 1) : onVolver}>{paso > 0 ? 'Anterior' : 'Cancelar'}</button>{paso < 2 ? <button type="button" className="ui-btn ui-btn--primary" onClick={siguiente}>Siguiente <i className="mdi mdi-arrow-right" /></button> : <button type="button" className="ui-btn ui-btn--primary guardar" disabled={guardando} onClick={guardar}>{guardando ? <span className="spinner" /> : <><i className="mdi mdi-check" /> Guardar cotización</>}</button>}</div>
      </div><ResumenTotales formulario={formulario} /></div>
      {guardado && <div className="exito"><div className="exito__caja"><div className="exito__circulo"><i className="mdi mdi-check" /></div><div className="exito__titulo">Cotización creada con éxito</div><div className="exito__nota">(demo — todavía no se guarda en base de datos)</div></div></div>}
    </form>
  )
}
