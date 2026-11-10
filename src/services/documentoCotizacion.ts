import axios from 'axios'
import {
  COLOR_DOCUMENTO_PREDETERMINADO, CONFIGURACION_DOCUMENTO_PREDETERMINADA, FUENTES_DOCUMENTO,
  esColorDocumento, esFuenteDocumento, obtenerConfiguracionDocumento, type ConfiguracionDocumento,
} from './configuracionDocumento'
import { obtenerImagenPartida } from './cotizaciones'
import { LIMITES_PERFIL_CUENTA, obtenerLogoCuenta, obtenerPerfilCuenta } from './perfilCuenta'
import { calcularTotales, dinero, fecha, formularioVacio, partidaVacia, type Cotizacion, type CotizacionForm } from '@/data/cotizaciones'

export const LOGO_DOCUMENTO_PREDETERMINADO = `${import.meta.env.BASE_URL}logo.png`

export interface EmisorDocumento {
  comercial: string
  perfilRegistrado?: boolean
  razonSocial?: string
  rfc?: string
  telefono?: string
  direccion?: string
  logo?: string
}

const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char] ?? char))

const LIMITES_DOCUMENTO = {
  nombreEmisor: LIMITES_PERFIL_CUENTA.comercial,
  razonSocial: LIMITES_PERFIL_CUENTA.razonSocial,
  nombreCliente: 31,
  atencionA: 31,
  direccion: LIMITES_PERFIL_CUENTA.direccion,
}

function abreviarTexto(valor: string, maximo: number) {
  const caracteres = Array.from(valor.trim())
  return caracteres.length > maximo
    ? `${caracteres.slice(0, maximo - 1).join('').trimEnd()}…`
    : caracteres.join('')
}

export function imagenDocumento(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer una imagen del documento.'))
    reader.readAsDataURL(blob)
  })
}

export async function obtenerEmisor(nombre: string, signal?: AbortSignal): Promise<EmisorDocumento> {
  const data = await obtenerPerfilCuenta(signal)
  if (!data) return { comercial: nombre }
  const emisor = { ...data, perfilRegistrado: true }
  if (!data.tieneLogo) return emisor
  try {
    const logo = await obtenerLogoCuenta(signal)
    return { ...emisor, logo: await imagenDocumento(logo) }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return emisor
    throw error
  }
}

type ImagenesDocumento = string[][]

export function documentoBorrador(form: CotizacionForm, emisor: EmisorDocumento, asesor: string, imagenes: ImagenesDocumento, configuracion: ConfiguracionDocumento) {
  const t = calcularTotales(form)
  return plantillaDocumento({
    ...form, folio: '', fechaCreacion: new Date().toISOString(), nombreAsesor: asesor,
    porcentajeIva: Number(form.porcentajeIva), porcentajeAnticipo: form.porcentajeAnticipo === '' ? null : Number(form.porcentajeAnticipo),
    subtotal: t.subtotal, impuestos: t.impuestos, total: t.total,
    partidas: form.partidas.map((p, i) => ({
      ...p, numeroPartida: i + 1, cantidad: Number(p.cantidad), precioUnitarioVenta: Number(p.precioUnitarioVenta),
      importe: Number(p.cantidad) * Number(p.precioUnitarioVenta) * (1 - p.porcentajeDescuento / 100),
    })),
  }, emisor, imagenes, configuracion)
}

export function documentoEjemplo(emisor: EmisorDocumento, asesor: string, configuracion: ConfiguracionDocumento) {
  const vigencia = new Date()
  vigencia.setDate(vigencia.getDate() + 15)
  return documentoBorrador({
    ...formularioVacio(),
    nombreComercial: 'Cliente de ejemplo',
    atencionA: 'Área de compras',
    vigenciaHasta: vigencia.toISOString().slice(0, 10),
    tiempoEntrega: '5 días hábiles',
    condicionesPago: 'Pago de contado',
    metodosPago: 'Transferencia bancaria',
    notasComerciales: 'Los datos de esta cotización son de ejemplo.',
    partidas: [
      { ...partidaVacia(), sku: 'PR-001', descripcion: 'Producto de ejemplo', cantidad: 2, precioUnitarioVenta: 1250 },
      { ...partidaVacia(), sku: 'SR-001', descripcion: 'Servicio de instalación', cantidad: 1, precioUnitarioVenta: 800 },
    ],
  }, emisor, asesor, [], configuracion)
}

type Documento = Pick<Cotizacion, 'folio' | 'fechaCreacion' | 'nombreComercial' | 'atencionA' | 'rfc' | 'correoContacto' |
  'telefonoContacto' | 'vigenciaHasta' | 'nombreAsesor' | 'moneda' | 'tiempoEntrega' | 'condicionesPago' |
  'metodosPago' | 'notasComerciales' | 'preciosIncluyenIva' | 'porcentajeIva' | 'porcentajeAnticipo' |
  'subtotal' | 'impuestos' | 'total'> & {
    partidas: Pick<Cotizacion['partidas'][number], 'numeroPartida' | 'sku' | 'descripcion' |
      'especificacionesTecnicas' | 'unidad' | 'cantidad' | 'precioUnitarioVenta' | 'importe' | 'porcentajeDescuento'>[]
  }

function plantillaDocumento(c: Documento, emisor: EmisorDocumento, imagenes: ImagenesDocumento, { color, fuente }: ConfiguracionDocumento) {
  const acento = esColorDocumento(color) ? color : COLOR_DOCUMENTO_PREDETERMINADO
  const familia = FUENTES_DOCUMENTO[esFuenteDocumento(fuente) ? fuente : CONFIGURACION_DOCUMENTO_PREDETERMINADA.fuente].familia
  const canales = [1, 3, 5].map((inicio) => parseInt(acento.slice(inicio, inicio + 2), 16) / 255)
  const [rojo, verde, azul] = canales.map((canal) => canal <= .04045 ? canal / 12.92 : ((canal + .055) / 1.055) ** 2.4)
  const luminancia = .2126 * rojo + .7152 * verde + .0722 * azul
  const textoFranja = luminancia > .179 ? '#000' : '#fff'
  const textoAcento = luminancia > .15 ? '#192d48' : acento
  const campo = (label: string, value: unknown, unaLinea = false) => value === undefined || value === null || value === '' ? '' :
    `<div class="campo"><span>${label}</span><strong${unaLinea ? ' class="una-linea"' : ''}>${escape(value)}</strong></div>`
  const monto = (n: number) => escape(dinero(n, c.moneda))
  const img = (src: string, alt: string) => /^data:image\/(png|jpeg);base64,/.test(src)
    ? `<img src="${escape(src)}" alt="${alt}">` : ''
  const logo = img(emisor.logo ?? '', 'Logo del emisor')
    || `<img src="${escape(LOGO_DOCUMENTO_PREDETERMINADO)}" alt="Logo de la aplicación">`
  const filas = c.partidas.map((p, i) => `<tr>
    <td>${p.cantidad}</td><td><div class="fotos">${(imagenes[i] ?? []).map((src) => img(src, 'Producto')).join('')}</div></td>
    <td>${p.sku ? `<small>SKU: ${escape(p.sku)}</small>` : ''}<strong>${escape(p.descripcion || 'Producto o servicio')}</strong>
    <small class="texto">${escape(p.especificacionesTecnicas)}</small></td>
    <td>${escape(p.unidad)}</td><td class="num">${monto(p.precioUnitarioVenta)}
    ${p.porcentajeDescuento ? `<small>Desc. ${p.porcentajeDescuento}%</small>` : ''}</td><td class="num"><strong>${monto(p.importe)}</strong></td>
  </tr>`).join('')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cotización ${escape(c.folio || 'en preparación')}</title><style>
    @page{size:letter;margin:14mm}
    *{box-sizing:border-box}body{--acento:${acento};--texto-franja:${textoFranja};--texto-acento:${textoAcento};--acento-suave:color-mix(in srgb,var(--acento) 9%,white);--borde-acento:color-mix(in srgb,var(--acento) 22%,white);margin:0;background:#fff;color:#192d48;font:12px ${familia};overflow-wrap:anywhere}
    main{padding:26px;max-width:816px;min-height:11in;margin:auto;display:flex;flex-direction:column}header{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,30%);align-items:start;gap:18px;border-bottom:3px solid var(--acento);padding-bottom:14px}
    header>div{min-width:0;overflow-wrap:anywhere}.emisor{display:flex;align-items:flex-start;gap:12px}
    .emisor img{display:block;width:min(100px,30%);max-height:58px;object-fit:contain;object-position:left top;flex:none}
    .emisor-datos{min-width:0}.emisor-datos h3{margin-bottom:4px}
    .una-linea{display:block;min-width:0;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .campo{min-width:0}
    h1{font-size:24px;margin:0 0 6px}h2{font-size:13px;margin:0 0 7px;color:var(--texto-acento)}h3{font-size:12px;margin:0 0 8px}p{margin:4px 0;line-height:1.4}
    h2.titulo-partidas,h2.titulo-seccion{margin:0;padding:4px 10px;font-size:12px;line-height:1.2;background:var(--acento);color:var(--texto-franja);text-align:center;break-after:avoid}
    .folio{text-align:right}.folio strong{font-size:14px}.muted,small,.campo span{color:#556780}
    section{margin-top:16px}.datos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px 12px;border-top:1px solid var(--borde-acento);padding-top:8px}
    .campo span,small{display:block;font-size:10px;margin-bottom:3px}.texto{white-space:pre-wrap}
    table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:10px}thead{display:table-header-group}
    th,td{border:1px solid var(--borde-acento);text-align:left;padding:5px;vertical-align:top}th{background:var(--acento-suave);color:var(--texto-acento)}
    tr,.final,header,.datos{break-inside:avoid}.num{text-align:right;font-variant-numeric:tabular-nums}
    .fotos{display:flex;gap:3px;flex-wrap:wrap}.fotos img{width:min(47%,50px);aspect-ratio:1;object-fit:contain;border:1px solid var(--borde-acento)}
    .final{display:grid;grid-template-columns:minmax(0,1fr) minmax(0, .85fr);gap:14px;padding-top:16px}.final h3{color:var(--texto-acento)}.totales{align-self:start;border:1px solid var(--borde-acento)}
    @media screen{body{position:relative}main{padding-bottom:70mm}.final{position:absolute;left:14mm;right:14mm;bottom:14mm}}
    .totales div{display:flex;justify-content:space-between;gap:8px;padding:7px;border-bottom:1px solid var(--borde-acento)}.totales strong{text-align:right}.gran-total{background:var(--acento-suave);font-size:13px}
    @media screen and (max-width:500px){main{padding:12px}.emisor{gap:8px}.emisor img{max-width:64px}h1{font-size:19px}.datos{grid-template-columns:repeat(2,minmax(0,1fr))}th,td{padding:3px}.final{grid-template-columns:minmax(0,1fr)}}
    @media print{
      body{print-color-adjust:exact;-webkit-print-color-adjust:exact}
      main{max-width:none;min-height:0;padding:0;display:block}
      .final{position:fixed;left:0;right:0;bottom:0;height:50mm;margin:0;padding-top:12px;border-top:1px solid var(--borde-acento);align-content:start}
      .reserva-pie{display:table-footer-group}
      .reserva-pie td{height:54mm;border:0;padding:0;background:white}
    }
    @media screen{.reserva-pie{display:none}}
  </style></head><body><main><header><div class="emisor">
    ${logo}<div class="emisor-datos"><h3 class="una-linea">${escape(abreviarTexto(emisor.comercial, LIMITES_DOCUMENTO.nombreEmisor))}</h3>
    ${emisor.razonSocial ? `<p class="una-linea">Razón social: ${escape(abreviarTexto(emisor.razonSocial, LIMITES_DOCUMENTO.razonSocial))}</p>` : ''}
    ${emisor.rfc ? `<p class="muted">RFC: ${escape(emisor.rfc)}</p>` : ''}
    ${emisor.direccion ? `<p class="muted una-linea">Dirección: ${escape(abreviarTexto(emisor.direccion, LIMITES_DOCUMENTO.direccion))}</p>` : ''}
    ${emisor.telefono ? `<p class="muted">Teléfono: ${escape(emisor.telefono)}</p>` : ''}</div>
  </div><div class="folio"><h1>Cotización</h1><strong>${escape(c.folio ? `Folio ${c.folio}` : 'Sin folio')}</strong><p>${escape(fecha(c.fechaCreacion))}</p></div></header>
  <section><h2 class="titulo-seccion">Datos del cliente</h2><div class="datos">${campo('Empresa / Nombre', abreviarTexto(c.nombreComercial, LIMITES_DOCUMENTO.nombreCliente), true)}${campo('Atención a', abreviarTexto(c.atencionA, LIMITES_DOCUMENTO.atencionA), true)}
    ${campo('RFC', c.rfc)}${campo('Teléfono', c.telefonoContacto)}${campo('Correo', c.correoContacto)}</div></section>
  <section><h2 class="titulo-seccion">Datos de la cotización</h2><div class="datos">${campo('Cotizador', c.nombreAsesor)}${campo('Vigencia', fecha(c.vigenciaHasta))}
    ${campo('Moneda', c.moneda)}${campo('Plazo de entrega', c.tiempoEntrega)}${campo('Condiciones de pago', c.condicionesPago)}
    ${campo('Anticipo', c.porcentajeAnticipo != null ? `${c.porcentajeAnticipo}%` : '')}</div></section>
  <section><h2 class="titulo-partidas">Productos y servicios</h2><table><colgroup><col style="width:10%"><col style="width:17%"><col style="width:32%"><col style="width:7%"><col style="width:15%"><col style="width:19%"></colgroup>
    <thead><tr><th>Cantidad</th><th>Imágenes</th><th>Descripción</th><th>Und.</th><th>Precio unitario</th><th>Importe</th></tr></thead><tbody>${filas}</tbody><tfoot class="reserva-pie"><tr><td colspan="6"></td></tr></tfoot></table></section>
  </main><section class="final"><div>
    ${c.metodosPago ? `<h3>Métodos de pago</h3><p class="texto">${escape(c.metodosPago)}</p>` : ''}
    ${c.notasComerciales ? `<h3>Notas adicionales</h3><p class="texto">${escape(c.notasComerciales)}</p>` : ''}
  </div><div class="totales"><div><span>Subtotal</span><strong>${monto(c.subtotal)}</strong></div>
    <div><span>${c.preciosIncluyenIva ? 'IVA incluido' : `IVA (${c.porcentajeIva ?? 0}%)`}</span><strong>${c.preciosIncluyenIva ? 'Incluido en el precio' : monto(c.impuestos)}</strong></div>
    <div class="gran-total"><span>Total</span><strong>${monto(c.total)}</strong></div>
  </div></section></body></html>`
  const document = new DOMParser().parseFromString(html, 'text/html')
  const pie = document.querySelector('.final')
  // Chromium repeats fixed elements from the page where they occur in DOM order.
  if (pie) document.body.prepend(pie)
  return '<!doctype html>' + document.documentElement.outerHTML
}

export function abrirVentanaDocumento() {
  const ventana = window.open('', '_blank')
  if (ventana) {
    ventana.opener = null
    ventana.document.title = 'Cotización'
    ventana.document.body.textContent = 'Preparando documento…'
  }
  return ventana
}

export async function prepararDocumentoGuardado(cotizacion: Cotizacion, nombre: string, signal: AbortSignal) {
  const [emisor, configuracion] = await Promise.all([
    obtenerEmisor(nombre, signal),
    obtenerConfiguracionDocumento(signal).catch(() => CONFIGURACION_DOCUMENTO_PREDETERMINADA),
  ])
  const imagenes: ImagenesDocumento = []
  // Load two images at a time to avoid opening many concurrent requests.
  for (const partida of cotizacion.partidas) {
    signal.throwIfAborted()
    imagenes.push(await Promise.all((partida.tieneImagen ?? []).map(async (tiene, i) =>
      tiene ? imagenDocumento(await obtenerImagenPartida(partida.id, i + 1, signal)) : '')))
  }
  return plantillaDocumento(cotizacion, emisor, imagenes, configuracion)
}

export async function imprimirDocumento(ventana: Window, cotizacion: Cotizacion, nombre: string) {
  const html = await prepararDocumentoGuardado(cotizacion, nombre, new AbortController().signal)
  if (ventana.closed) return
  ventana.document.open()
  ventana.document.write(html)
  ventana.document.close()
  await Promise.all(Array.from(ventana.document.images, (image) => image.decode()))
  if (!ventana.closed) {
    ventana.focus()
    ventana.print()
  }
}
