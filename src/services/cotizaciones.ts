import api from './api'
import type { Cotizacion, CotizacionForm } from '@/data/cotizaciones'

// Capa de acceso a la API de cotizaciones. El backend expone el JSON con los
// mismos nombres de campo que el tipo Cotizacion, así que listar/detalle no
// requieren transformar nada.

export async function listarCotizaciones(): Promise<Cotizacion[]> {
  const { data } = await api.get<Cotizacion[]>('/cotizaciones')
  return data
}

// Convierte el formulario (que mezcla números y textos) al cuerpo que espera el
// backend: números limpios y el anticipo vacío como null. Los totales y el folio
// los calcula el backend.
export async function crearCotizacion(form: CotizacionForm): Promise<Cotizacion> {
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
  const { data } = await api.post<Cotizacion>('/cotizaciones', payload)
  return data
}

export async function eliminarCotizacion(id: number): Promise<void> {
  await api.delete(`/cotizaciones/${id}`)
}
