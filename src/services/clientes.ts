import api from './api'
import type { ClienteRegistrado, CotizacionCliente } from '@/data/clientes'

// Capa de acceso a la API de clientes. El backend expone el JSON con los mismos
// nombres de campo que ClienteRegistrado, así que no hay que transformar nada.

export async function listarClientes(): Promise<ClienteRegistrado[]> {
  const { data } = await api.get<ClienteRegistrado[]>('/clientes')
  return data
}

export async function crearCliente(
  datos: Omit<ClienteRegistrado, 'idCliente' | 'fechaAlta'>,
): Promise<ClienteRegistrado> {
  const { data } = await api.post<ClienteRegistrado>('/clientes', datos)
  return data
}

interface HistorialCliente {
  fechaAlta: string
  cotizaciones: CotizacionCliente[]
  foliosEliminados: string[]
}

export async function obtenerHistorialCliente(id: number, signal: AbortSignal): Promise<HistorialCliente> {
  const { data } = await api.get<HistorialCliente>(`/clientes/${id}/cotizaciones`, { signal })
  return data
}

