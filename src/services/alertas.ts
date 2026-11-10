import api from './api'

export interface AlertaVencimiento {
  id: number
  folio: string
  cliente: string
  diasRestantes: number
}

export async function listarAlertasVencimiento(signal: AbortSignal): Promise<AlertaVencimiento[]> {
  const { data } = await api.get<AlertaVencimiento[]>('/cotizaciones/por-vencer', { signal })
  return data
}

export async function obtenerDiasAlerta(signal: AbortSignal): Promise<number> {
  const { data } = await api.get<{ dias: number }>('/configuracion/alertas', { signal })
  return data.dias
}

export async function guardarDiasAlerta(dias: number): Promise<number> {
  const { data } = await api.put<{ dias: number }>('/configuracion/alertas', { dias })
  return data.dias
}
