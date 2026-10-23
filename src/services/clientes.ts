import api from './api'
import type { ClienteRegistrado } from '@/data/clientes'

// Capa de acceso a la API de clientes. El backend expone el JSON con los mismos
// nombres de campo que ClienteRegistrado, así que no hay que transformar nada.

export async function listarClientes(): Promise<ClienteRegistrado[]> {
  const { data } = await api.get<ClienteRegistrado[]>('/clientes')
  return data
}

export async function crearCliente(
  datos: Omit<ClienteRegistrado, 'idCliente'>,
): Promise<ClienteRegistrado> {
  const { data } = await api.post<ClienteRegistrado>('/clientes', datos)
  return data
}

export async function eliminarCliente(id: number): Promise<void> {
  await api.delete(`/clientes/${id}`)
}
