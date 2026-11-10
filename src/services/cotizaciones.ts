import axios from 'axios'
import api from './api'
import { formularioVacio, partidaVacia, type Cotizacion, type CotizacionForm } from '@/data/cotizaciones'

export const MAX_IMAGEN_PARTIDA = 2 * 1024 * 1024
export const MAX_IMAGENES_COTIZACION = 15 * 1024 * 1024

export async function obtenerImagenPartida(id: number, slot: number, signal: AbortSignal): Promise<Blob> {
  const { data } = await api.get<Blob>(`/cotizaciones/partidas/${id}/imagenes/${slot}`, { responseType: 'blob', signal })
  return data
}

export async function obtenerPdfCotizacion(id: number, signal: AbortSignal): Promise<Blob | null> {
  try {
    const { data } = await api.get<{ pdf: string }>(`/cotizaciones/${id}/documento`, {
      signal,
      headers: { Accept: 'application/json' },
    })
    const pdf = atob(data.pdf)
    if (!pdf.startsWith('%PDF-')) throw new Error('La respuesta no es un PDF.')
    return new Blob([Uint8Array.from(pdf, (caracter) => caracter.charCodeAt(0))], { type: 'application/pdf' })
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

// Capa de acceso a la API de cotizaciones. El backend expone el JSON con los
// mismos nombres de campo que el tipo Cotizacion, así que listar/detalle no
// requieren transformar nada.

export async function listarCotizaciones(signal?: AbortSignal): Promise<Cotizacion[]> {
  const { data } = await api.get<Cotizacion[]>('/cotizaciones', { signal })
  return data
}

// Convierte el formulario (que mezcla números y textos) al cuerpo que espera el
// backend: números limpios y el anticipo vacío como null. Los totales y el folio
// los calcula el backend.
export async function formularioParaEditar(c: Cotizacion): Promise<CotizacionForm> {
  const partidas: CotizacionForm['partidas'] = []
  for (const p of c.partidas) {
    const imagenes: [File | null, File | null] = [null, null]
    for (const slot of [0, 1] as const) {
      if (!p.tieneImagen?.[slot]) continue
      const blob = await obtenerImagenPartida(p.id, slot + 1, new AbortController().signal)
      imagenes[slot] = new File([blob], `imagen-${p.id}-${slot + 1}.${blob.type === 'image/png' ? 'png' : 'jpg'}`, { type: blob.type })
    }
    partidas.push({
      ...partidaVacia(), origenId: p.id, sku: p.sku, descripcion: p.descripcion, especificacionesTecnicas: p.especificacionesTecnicas,
      cantidad: p.cantidad, unidad: p.unidad, precioUnitarioCompra: p.precioUnitarioCompra ?? 0,
      precioUnitarioVenta: p.precioUnitarioVenta, porcentajeDescuento: p.porcentajeDescuento ?? 0,
      requiereCompra: p.requiereCompra, imagenes,
    })
  }
  return {
    ...formularioVacio(), idCliente: c.idCliente ?? null, tipoCliente: c.tipoCliente,
    nombreComercial: c.nombreComercial, atencionA: c.atencionA, rfc: c.rfc,
    correoContacto: c.correoContacto ?? '', telefonoContacto: c.telefonoContacto ?? '',
    vigenciaHasta: c.vigenciaHasta, moneda: c.moneda, preciosIncluyenIva: c.preciosIncluyenIva ?? true,
    porcentajeIva: c.porcentajeIva ?? 16, porcentajeAnticipo: c.porcentajeAnticipo ?? '',
    tiempoEntrega: c.tiempoEntrega ?? '', condicionesPago: c.condicionesPago ?? '',
    notasComerciales: c.notasComerciales ?? '', metodosPago: c.metodosPago ?? '', partidas,
  }
}

export async function crearCotizacion(form: CotizacionForm, id?: number): Promise<Cotizacion> {
  const payload = {
    idCliente: form.idCliente,
    tipoCliente: form.tipoCliente,
    nombreComercial: form.nombreComercial,
    atencionA: form.atencionA,
    rfc: form.rfc,
    correoContacto: form.correoContacto,
    telefonoContacto: form.telefonoContacto,
    vigenciaHasta: form.vigenciaHasta,
    moneda: form.moneda,
    preciosIncluyenIva: form.preciosIncluyenIva,
    porcentajeIva: Number(form.porcentajeIva) || 0,
    porcentajeAnticipo: form.porcentajeAnticipo === '' ? null : Number(form.porcentajeAnticipo),
    tiempoEntrega: form.tiempoEntrega,
    condicionesPago: form.condicionesPago,
    notasComerciales: form.notasComerciales,
    metodosPago: form.metodosPago,
    partidas: form.partidas.map((p) => ({
      origenId: p.origenId,
      sku: p.sku,
      descripcion: p.descripcion,
      especificacionesTecnicas: p.especificacionesTecnicas,
      unidad: p.unidad,
      cantidad: Number(p.cantidad) || 0,
      precioUnitarioCompra: Number(p.precioUnitarioCompra) || 0,
      precioUnitarioVenta: Number(p.precioUnitarioVenta) || 0,
      porcentajeDescuento: Number(p.porcentajeDescuento) || 0,
      requiereCompra: p.requiereCompra,
    })),
  }
  const adjuntos = new FormData()
  adjuntos.append('datos', JSON.stringify(payload))
  let total = 0
  form.partidas.forEach((p, i) => p.imagenes?.forEach((file, slot) => {
    if (!file) return
    total += file.size
    adjuntos.append(`imagen_${i}_${slot + 1}`, file)
  }))
  if (total > MAX_IMAGENES_COTIZACION) throw new Error('Las imágenes de la cotización no pueden superar 15 MB en total.')
  const { data } = id
    ? await api.put<Cotizacion>(`/cotizaciones/${id}`, total ? adjuntos : payload)
    : await api.post<Cotizacion>('/cotizaciones', total ? adjuntos : payload)
  return data
}

export async function eliminarCotizacion(id: number): Promise<void> {
  await api.delete(`/cotizaciones/${id}`)
}

export async function archivarCotizacion(id: number): Promise<void> {
  await api.put(`/cotizaciones/${id}/archivo`)
}
