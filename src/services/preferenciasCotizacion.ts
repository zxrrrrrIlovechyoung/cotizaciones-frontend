import api from './api'

export interface PreferenciasCotizacion {
  moneda: 'MXN' | 'USD'
  vigenciaDias: number | null
}

export async function obtenerPreferenciasCotizacion(signal: AbortSignal): Promise<PreferenciasCotizacion> {
  const { data } = await api.get<PreferenciasCotizacion>('/configuracion/cotizaciones', { signal })
  return data
}

export async function guardarPreferenciasCotizacion(preferencias: PreferenciasCotizacion): Promise<PreferenciasCotizacion> {
  const { data } = await api.put<PreferenciasCotizacion>('/configuracion/cotizaciones', preferencias)
  return data
}
