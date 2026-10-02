// Datos estáticos para ir viendo el flujo del workspace de cotizaciones.
// Cuando modelemos la base de datos, esto se reemplaza por llamadas a la API
// (services/api.ts) manteniendo los mismos tipos.

// El sistema solo genera cotizaciones, no lleva un historial de flujo de venta:
// cada una queda Aceptada al crearse, y "Eliminada" es un borrado suave (no aparece
// en la lista, pero no se pierde el registro).
export type EstadoCotizacion = 'Aceptada' | 'Eliminada'

export type EstadoCompra = 'Agendada' | 'Comprada' | 'Cancelada' | null

export interface Partida {
  id: number
  numeroPartida: number
  descripcion: string
  especificacionesTecnicas: string
  sku: string
  cantidad: number
  unidad: string
  precioUnitarioVenta: number
  importe: number
  requiereCompra: boolean
  estadoCompra: EstadoCompra
}

export interface Cotizacion {
  id: number
  folio: string
  version: number
  estado: EstadoCotizacion
  fechaCreacion: string
  tipoCliente: 'Empresa' | 'Particular'
  razonSocial: string
  rfc: string
  nombreCliente: string
  nombreComercial: string
  atencionA: string
  nombreAsesor: string
  moneda: string
  vigenciaHasta: string
  costo: number
  subtotal: number
  impuestos: number
  total: number
  utilidadEstimada: number
  partidas: Partida[]
}

// Estilos por estado. "Eliminada" solo se usa para filtrar la lista, nunca se
// muestra como badge (una cotización eliminada no aparece en ningún lado).
export const ESTADOS: Record<EstadoCotizacion, { bg: string; color: string; label?: string }> = {
  Aceptada: { bg: 'var(--success-bg)', color: 'var(--success)' },
  Eliminada: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
}

export const CHIP_ESTADO_COMPRA: Record<string, { bg: string; color: string; label: string }> = {
  Agendada: { bg: 'var(--warning-bg)', color: 'var(--warning)', label: 'Compra agendada' },
  Comprada: { bg: 'var(--success-bg)', color: 'var(--success)', label: 'Comprada' },
  Cancelada: { bg: 'var(--danger-bg)', color: 'var(--danger)', label: 'Compra cancelada' },
}

export const dinero = (valor: number, moneda = 'MXN') =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda || 'MXN',
    maximumFractionDigits: 2,
  }).format(Number(valor || 0))

export const fecha = (valor: string) =>
  valor
    ? new Date(`${String(valor).slice(0, 10)}T12:00:00`).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Sin definir'

/* ───────────────── Formulario de alta ───────────────── */

export interface PartidaForm {
  tipoPartida: 'Producto' | 'Servicio'
  estadoArticulo: 'Nuevo' | 'Reacondicionado' | 'Usado'
  sku: string
  descripcion: string
  especificacionesTecnicas: string
  unidad: string
  cantidad: number | string
  precioUnitarioCompra: number | string
  precioUnitarioVenta: number | string
  porcentajeDescuento: number
  color: string
  marca: string
  tiempoEntrega: string
  observaciones: string
  requiereCompra: boolean
  imagenPreview: string | null
  imagenPreview2: string | null
}

export interface CotizacionForm {
  idCliente: number | null
  tipoCliente: string
  nombreComercial: string
  atencionA: string
  rfc: string
  correoContacto: string
  telefonoContacto: string
  vigenciaHasta: string
  moneda: string
  preciosIncluyenIva: boolean
  porcentajeIva: number
  porcentajeAnticipo: number | ''
  tiempoEntrega: string
  condicionesPago: string
  notasComerciales: string
  metodosPago: string
  partidas: PartidaForm[]
}

export const PASOS = ['Cliente', 'Productos', 'Condiciones']

export const MAX_PARTIDAS = 60

export const TIPOS_CLIENTE = ['Empresa', 'Escuela', 'Comercio', 'Particular', 'Gobierno', 'Otro']

export const UNIDADES = [
  { value: 'PZA', label: 'PZA — Pieza' },
  { value: 'CAJA', label: 'CAJA — Caja' },
  { value: 'KG', label: 'KG — Kilogramos' },
  { value: 'LT', label: 'LT — Litros' },
  { value: 'SERVICIO', label: 'SERVICIO' },
  { value: 'LICENCIA', label: 'LICENCIA' },
  { value: 'PAQUETE', label: 'PAQUETE' },
  { value: 'METRO', label: 'METRO' },
]

export const NOTAS_PREDEFINIDAS = [
  'PRECIOS SUJETOS A VARIACIÓN DEL PRECIO DEL DÓLAR.',
  'CONSULTAR PREVIAMENTE LA DISPONIBILIDAD DE LOS PRODUCTOS O SERVICIOS CON SU EJECUTIVO DE VENTAS.',
  'EL MONTO TOTAL YA INCLUYE IVA.',
  'PRECIOS SUJETOS A CAMBIO SIN PREVIO AVISO.',
  'UNA VEZ AUTORIZADO Y ADQUIRIDO EL PRODUCTO DE DICHA COTIZACIÓN POR PARTE DEL CLIENTE NO HABRÁ CAMBIOS NI DEVOLUCIONES DE EFECTIVO Y DE PRODUCTO(S).',
]

export const CONDICIONES_PREDEFINIDAS = [
  'Pago de contado.',
  '100% de anticipo para iniciar el pedido.',
  '50% de anticipo y 50% contra entrega.',
  '30 días neto a partir de la fecha de factura.',
  '60 días neto a partir de la fecha de factura.',
  'Transferencia bancaria previa a la entrega del equipo.',
  'Cheque certificado o de caja a nombre de la empresa.',
]

// Datos de ejemplo genéricos — NUNCA usar una CLABE, cuenta o titular real aquí.
export const METODOS_PAGO_PREDEFINIDOS = [
  'Banco Ejemplo — CLABE: 000000000000000000 — Cuenta: 0000000000 — Titular: Empresa de Ejemplo S.A. de C.V.',
  'Efectivo en sucursal.',
  'Transferencia SPEI.',
]

// Capitaliza cada palabra — el original lo aplica al escribir nombres y descripciones.
export const toTitleCase = (s: string) =>
  String(s ?? '').replace(/(^|\s)(\p{L})/gu, (_, sep: string, letra: string) => sep + letra.toUpperCase())

export const capitalizar = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

// Formato "773 185 1363": bloques de 3-3-4.
export const formatTel = (v: string) => {
  const d = String(v ?? '').replace(/\D/g, '').slice(0, 10)
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(' ')
}

export const partidaVacia = (): PartidaForm => ({
  tipoPartida: 'Producto',
  estadoArticulo: 'Nuevo',
  sku: '',
  descripcion: '',
  especificacionesTecnicas: '',
  unidad: 'PZA',
  cantidad: 1,
  precioUnitarioCompra: '',
  precioUnitarioVenta: '',
  porcentajeDescuento: 0,
  color: '',
  marca: '',
  tiempoEntrega: '',
  observaciones: '',
  requiereCompra: true,
  imagenPreview: null,
  imagenPreview2: null,
})

export const formularioVacio = (): CotizacionForm => ({
  idCliente: null,
  tipoCliente: 'Empresa',
  nombreComercial: '',
  atencionA: '',
  rfc: '',
  correoContacto: '',
  telefonoContacto: '',
  vigenciaHasta: '',
  moneda: 'MXN',
  preciosIncluyenIva: true,
  porcentajeIva: 16,
  porcentajeAnticipo: '',
  tiempoEntrega: '',
  condicionesPago: '',
  notasComerciales: '',
  metodosPago: '',
  partidas: [partidaVacia()],
})

// Totales del formulario. Regla del original: si "los precios ya incluyen IVA",
// el precio capturado es el final y el IVA NO se desglosa (queda en 0), de modo
// que Subtotal + IVA siempre da el Total.
export function calcularTotales(f: CotizacionForm) {
  const acc = { subtotal: 0, descuento: 0, impuestos: 0, total: 0, compra: 0 }

  for (const p of f.partidas) {
    const cantidad = Number(p.cantidad || 0)
    const venta = Number(p.precioUnitarioVenta || 0)
    const compra = Number(p.precioUnitarioCompra || 0)

    const descuento = (cantidad * venta * Number(p.porcentajeDescuento || 0)) / 100
    const base = cantidad * venta - descuento
    const impuesto = f.preciosIncluyenIva ? 0 : (base * Number(f.porcentajeIva || 0)) / 100

    acc.subtotal += base
    acc.descuento += descuento
    acc.impuestos += impuesto
    acc.total += base + impuesto
    acc.compra += cantidad * compra
  }

  const utilidad = acc.subtotal - acc.compra
  const margenPct = acc.subtotal > 0 ? (utilidad / acc.subtotal) * 100 : 0

  return { ...acc, utilidad, margenPct }
}

// Una partida "con contenido" pide confirmación antes de borrarse.
export const partidaTieneContenido = (p: PartidaForm) =>
  Boolean(
    p.descripcion.trim() ||
      p.sku.trim() ||
      p.especificacionesTecnicas.trim() ||
      p.color.trim() ||
      p.marca.trim() ||
      p.tiempoEntrega.trim() ||
      p.observaciones.trim() ||
      Number(p.precioUnitarioCompra || 0) > 0 ||
      Number(p.precioUnitarioVenta || 0) > 0 ||
      Number(p.porcentajeDescuento || 0) > 0 ||
      Number(p.cantidad || 0) !== 1 ||
      p.imagenPreview ||
      p.imagenPreview2,
  )

export const COTIZACIONES: Cotizacion[] = [
  {
    id: 1,
    folio: '0041',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-10-02',
    tipoCliente: 'Empresa',
    razonSocial: 'Distribuidora El Roble S.A. de C.V.',
    rfc: 'DER950101AB1',
    nombreCliente: 'Marcela Ruiz',
    nombreComercial: 'Distribuidora El Roble S.A. de C.V.',
    atencionA: 'Ing. Marcela Ruiz',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-15',
    costo: 34200,
    subtotal: 42750,
    impuestos: 6840,
    total: 49590,
    utilidadEstimada: 8550,
    partidas: [
      {
        id: 11,
        numeroPartida: 1,
        descripcion: 'Servicio de mantenimiento mayor (aceite, filtros y afinación)',
        especificacionesTecnicas: 'Incluye aceite sintético 5W-30 y filtro de aire',
        sku: '',
        cantidad: 5,
        unidad: 'SERVICIO',
        precioUnitarioVenta: 1800,
        importe: 9000,
        requiereCompra: false,
        estadoCompra: null,
      },
      {
        id: 12,
        numeroPartida: 2,
        descripcion: 'Balatas cerámicas delanteras',
        especificacionesTecnicas: 'Juego completo, incluye instalación',
        sku: 'BAL-CER-DEL',
        cantidad: 5,
        unidad: 'PZA',
        precioUnitarioVenta: 950,
        importe: 4750,
        requiereCompra: true,
        estadoCompra: 'Agendada',
      },
      {
        id: 13,
        numeroPartida: 3,
        descripcion: 'Llantas 195/65 R15',
        especificacionesTecnicas: 'Radial, índice de carga 91H',
        sku: 'LLA-195-65-R15',
        cantidad: 20,
        unidad: 'PZA',
        precioUnitarioVenta: 1450,
        importe: 29000,
        requiereCompra: true,
        estadoCompra: 'Comprada',
      },
    ],
  },
  {
    id: 2,
    folio: '0040',
    version: 2,
    estado: 'Aceptada',
    fechaCreacion: '2026-10-01',
    tipoCliente: 'Empresa',
    razonSocial: 'Constructora Vega y Asociados',
    rfc: 'CVA010203XY9',
    nombreCliente: 'Hugo Vega',
    nombreComercial: 'Constructora Vega y Asociados',
    atencionA: 'Lic. Hugo Vega',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-24',
    costo: 8760,
    subtotal: 10950,
    impuestos: 1752,
    total: 12702,
    utilidadEstimada: 2190,
    partidas: [
      {
        id: 21,
        numeroPartida: 1,
        descripcion: 'Cambio de amortiguadores delanteros',
        especificacionesTecnicas: 'Par, incluye mano de obra',
        sku: 'AMO-DEL-PAR',
        cantidad: 3,
        unidad: 'PZA',
        precioUnitarioVenta: 3200,
        importe: 9600,
        requiereCompra: true,
        estadoCompra: 'Comprada',
      },
      {
        id: 22,
        numeroPartida: 2,
        descripcion: 'Alineación y balanceo',
        especificacionesTecnicas: '4 ruedas, incluye rotación',
        sku: '',
        cantidad: 3,
        unidad: 'SERVICIO',
        precioUnitarioVenta: 450,
        importe: 1350,
        requiereCompra: false,
        estadoCompra: null,
      },
    ],
  },
  {
    id: 3,
    folio: '0039',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-09-29',
    tipoCliente: 'Particular',
    razonSocial: 'Ana Sofía Miranda',
    rfc: 'SOMA920614KQ7',
    nombreCliente: 'Ana Sofía Miranda',
    nombreComercial: 'Ana Sofía Miranda',
    atencionA: '',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-31',
    costo: 2280,
    subtotal: 2850,
    impuestos: 456,
    total: 3306,
    utilidadEstimada: 570,
    partidas: [
      {
        id: 31,
        numeroPartida: 1,
        descripcion: 'Batería 12V 650A',
        especificacionesTecnicas: 'Libre de mantenimiento, garantía 18 meses',
        sku: 'BAT-12V-650A',
        cantidad: 1,
        unidad: 'PZA',
        precioUnitarioVenta: 2850,
        importe: 2850,
        requiereCompra: true,
        estadoCompra: null,
      },
    ],
  },
  {
    id: 4,
    folio: '0038',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-09-21',
    tipoCliente: 'Empresa',
    razonSocial: 'Clínica Santa Elena',
    rfc: 'CSE030915QQ2',
    nombreCliente: 'Paulina Ortiz',
    nombreComercial: 'Clínica Santa Elena',
    atencionA: 'Dra. Paulina Ortiz',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '',
    costo: 5500,
    subtotal: 6800,
    impuestos: 1088,
    total: 7888,
    utilidadEstimada: 1300,
    partidas: [
      {
        id: 41,
        numeroPartida: 1,
        descripcion: 'Kit de distribución (banda, tensor y bomba de agua)',
        especificacionesTecnicas: 'Incluye mano de obra e instalación',
        sku: 'KIT-DIST-01',
        cantidad: 1,
        unidad: 'PZA',
        precioUnitarioVenta: 6800,
        importe: 6800,
        requiereCompra: true,
        estadoCompra: null,
      },
    ],
  },
  {
    id: 5,
    folio: '0037',
    version: 3,
    estado: 'Eliminada',
    fechaCreacion: '2026-08-18',
    tipoCliente: 'Empresa',
    razonSocial: 'Transportes del Bajío',
    rfc: 'TBA150720JJ4',
    nombreCliente: 'Julio Navarro',
    nombreComercial: 'Transportes del Bajío',
    atencionA: 'C.P. Julio Navarro',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-08-28',
    costo: 46400,
    subtotal: 58000,
    impuestos: 9280,
    total: 67280,
    utilidadEstimada: 11600,
    partidas: [
      {
        id: 51,
        numeroPartida: 1,
        descripcion: 'Servicio de frenos completo (4 ruedas)',
        especificacionesTecnicas: 'Balatas, discos y rectificado',
        sku: '',
        cantidad: 8,
        unidad: 'SERVICIO',
        precioUnitarioVenta: 2600,
        importe: 20800,
        requiereCompra: false,
        estadoCompra: null,
      },
      {
        id: 52,
        numeroPartida: 2,
        descripcion: 'Llantas 22.5 para tráiler',
        especificacionesTecnicas: 'Radial, alta resistencia',
        sku: 'LLA-225-TRA',
        cantidad: 6,
        unidad: 'PZA',
        precioUnitarioVenta: 6200,
        importe: 37200,
        requiereCompra: true,
        estadoCompra: 'Cancelada',
      },
    ],
  },
  {
    id: 6,
    folio: '0036',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-08-01',
    tipoCliente: 'Particular',
    razonSocial: 'Roberto Cárdenas',
    rfc: 'CARO840219H12',
    nombreCliente: 'Roberto Cárdenas',
    nombreComercial: 'Roberto Cárdenas',
    atencionA: '',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-08-10',
    costo: 650,
    subtotal: 850,
    impuestos: 136,
    total: 986,
    utilidadEstimada: 200,
    partidas: [
      {
        id: 61,
        numeroPartida: 1,
        descripcion: 'Cambio de aceite y filtro',
        especificacionesTecnicas: 'Aceite sintético 5W-30, 4 litros',
        sku: '',
        cantidad: 1,
        unidad: 'SERVICIO',
        precioUnitarioVenta: 850,
        importe: 850,
        requiereCompra: false,
        estadoCompra: null,
      },
    ],
  },
  {
    id: 7,
    folio: '0035',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-10-03',
    tipoCliente: 'Empresa',
    razonSocial: 'Servicios Industriales Atlas',
    rfc: 'SIA120430M81',
    nombreCliente: 'Mónica Salazar',
    nombreComercial: 'Servicios Industriales Atlas',
    atencionA: 'Mónica Salazar',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-18',
    costo: 18400,
    subtotal: 23600,
    impuestos: 3776,
    total: 27376,
    utilidadEstimada: 5200,
    partidas: [
      {
        id: 71,
        numeroPartida: 1,
        descripcion: 'Servicio preventivo para flotilla ligera',
        especificacionesTecnicas: 'Incluye revisión general y cambio de consumibles',
        sku: '',
        cantidad: 4,
        unidad: 'SERVICIO',
        precioUnitarioVenta: 5900,
        importe: 23600,
        requiereCompra: false,
        estadoCompra: null,
      },
    ],
  },
  {
    id: 8,
    folio: '0034',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-10-04',
    tipoCliente: 'Empresa',
    razonSocial: 'Grupo Comercial Hidalgo',
    rfc: 'GCH090807P22',
    nombreCliente: 'Ernesto Molina',
    nombreComercial: 'Grupo Comercial Hidalgo',
    atencionA: 'Ernesto Molina',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-20',
    costo: 12800,
    subtotal: 16250,
    impuestos: 2600,
    total: 18850,
    utilidadEstimada: 3450,
    partidas: [
      {
        id: 81,
        numeroPartida: 1,
        descripcion: 'Cambio de discos y balatas delanteras',
        especificacionesTecnicas: 'Incluye rectificado e instalación',
        sku: 'FRN-DEL-STD',
        cantidad: 2,
        unidad: 'PAQUETE',
        precioUnitarioVenta: 8125,
        importe: 16250,
        requiereCompra: true,
        estadoCompra: 'Agendada',
      },
    ],
  },
  {
    id: 9,
    folio: '0033',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-10-05',
    tipoCliente: 'Particular',
    razonSocial: 'Daniela Pérez',
    rfc: 'PEDA900118Q45',
    nombreCliente: 'Daniela Pérez',
    nombreComercial: 'Daniela Pérez',
    atencionA: '',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-21',
    costo: 3100,
    subtotal: 4250,
    impuestos: 680,
    total: 4930,
    utilidadEstimada: 1150,
    partidas: [
      {
        id: 91,
        numeroPartida: 1,
        descripcion: 'Sensor de oxígeno e instalación',
        especificacionesTecnicas: 'Compatible con motor 1.6L',
        sku: 'SEN-OX-16',
        cantidad: 1,
        unidad: 'PZA',
        precioUnitarioVenta: 4250,
        importe: 4250,
        requiereCompra: true,
        estadoCompra: null,
      },
    ],
  },
  {
    id: 10,
    folio: '0032',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-10-06',
    tipoCliente: 'Empresa',
    razonSocial: 'Operadora Vial del Centro',
    rfc: 'OVC160522L19',
    nombreCliente: 'Sergio Luna',
    nombreComercial: 'Operadora Vial del Centro',
    atencionA: 'Sergio Luna',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-22',
    costo: 27400,
    subtotal: 34100,
    impuestos: 5456,
    total: 39556,
    utilidadEstimada: 6700,
    partidas: [
      {
        id: 101,
        numeroPartida: 1,
        descripcion: 'Llantas para camioneta de reparto',
        especificacionesTecnicas: 'Juego de 4, balanceo incluido',
        sku: 'LLA-CAM-REP',
        cantidad: 4,
        unidad: 'PZA',
        precioUnitarioVenta: 8525,
        importe: 34100,
        requiereCompra: true,
        estadoCompra: 'Comprada',
      },
    ],
  },
  {
    id: 11,
    folio: '0031',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-10-07',
    tipoCliente: 'Empresa',
    razonSocial: 'Refacciones Montiel',
    rfc: 'RMO070912T66',
    nombreCliente: 'Laura Montiel',
    nombreComercial: 'Refacciones Montiel',
    atencionA: 'Laura Montiel',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-23',
    costo: 7300,
    subtotal: 9800,
    impuestos: 1568,
    total: 11368,
    utilidadEstimada: 2500,
    partidas: [
      {
        id: 111,
        numeroPartida: 1,
        descripcion: 'Paquete de filtros para servicio menor',
        especificacionesTecnicas: 'Filtro de aire, aceite y cabina',
        sku: 'KIT-FILT-03',
        cantidad: 5,
        unidad: 'PAQUETE',
        precioUnitarioVenta: 1960,
        importe: 9800,
        requiereCompra: true,
        estadoCompra: null,
      },
    ],
  },
  {
    id: 12,
    folio: '0030',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-10-08',
    tipoCliente: 'Particular',
    razonSocial: 'Javier Ortega',
    rfc: 'OEJA860503N28',
    nombreCliente: 'Javier Ortega',
    nombreComercial: 'Javier Ortega',
    atencionA: '',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-25',
    costo: 1560,
    subtotal: 2200,
    impuestos: 352,
    total: 2552,
    utilidadEstimada: 640,
    partidas: [
      {
        id: 121,
        numeroPartida: 1,
        descripcion: 'Diagnóstico electrónico',
        especificacionesTecnicas: 'Escaneo con reporte de códigos',
        sku: '',
        cantidad: 1,
        unidad: 'SERVICIO',
        precioUnitarioVenta: 2200,
        importe: 2200,
        requiereCompra: false,
        estadoCompra: null,
      },
    ],
  },
  {
    id: 13,
    folio: '0029',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-10-09',
    tipoCliente: 'Empresa',
    razonSocial: 'Alimentos La Huerta',
    rfc: 'ALH110628B73',
    nombreCliente: 'Patricia Gómez',
    nombreComercial: 'Alimentos La Huerta',
    atencionA: 'Patricia Gómez',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-27',
    costo: 21900,
    subtotal: 28600,
    impuestos: 4576,
    total: 33176,
    utilidadEstimada: 6700,
    partidas: [
      {
        id: 131,
        numeroPartida: 1,
        descripcion: 'Reparación de sistema de enfriamiento',
        especificacionesTecnicas: 'Radiador, termostato y anticongelante',
        sku: 'ENF-RAD-01',
        cantidad: 2,
        unidad: 'SERVICIO',
        precioUnitarioVenta: 14300,
        importe: 28600,
        requiereCompra: true,
        estadoCompra: 'Agendada',
      },
    ],
  },
  {
    id: 14,
    folio: '0028',
    version: 1,
    estado: 'Aceptada',
    fechaCreacion: '2026-10-10',
    tipoCliente: 'Empresa',
    razonSocial: 'Maquinaria Gómez Hermanos',
    rfc: 'MGH040316U55',
    nombreCliente: 'Ricardo Gómez',
    nombreComercial: 'Maquinaria Gómez Hermanos',
    atencionA: 'Ricardo Gómez',
    nombreAsesor: 'Raúl Cruz',
    moneda: 'MXN',
    vigenciaHasta: '2026-10-28',
    costo: 39100,
    subtotal: 48200,
    impuestos: 7712,
    total: 55912,
    utilidadEstimada: 9100,
    partidas: [
      {
        id: 141,
        numeroPartida: 1,
        descripcion: 'Mantenimiento correctivo a unidad diesel',
        especificacionesTecnicas: 'Incluye bomba, inyectores y mano de obra',
        sku: 'DSL-COR-02',
        cantidad: 1,
        unidad: 'SERVICIO',
        precioUnitarioVenta: 48200,
        importe: 48200,
        requiereCompra: true,
        estadoCompra: null,
      },
    ],
  },
]
