import axios from 'axios'
import api from './api'

export const LIMITES_PERFIL_CUENTA = {
  comercial: 53,
  razonSocial: 38,
  direccion: 40,
} as const

export interface PerfilCuenta {
  tipo: 'Empresa' | 'Persona'
  comercial: string
  razonSocial: string
  rfc: string
  telefono: string
  direccion: string
  tieneLogo: boolean
  puedeEditar: boolean
  disponibleDesde: string | null
}

export type DatosComerciales = Pick<PerfilCuenta, 'comercial' | 'razonSocial' | 'rfc' | 'telefono' | 'direccion'>

const formatoFechaEdicion = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City',
})

export function formatearFechaEdicion(fecha: string) {
  return formatoFechaEdicion.format(new Date(fecha))
}

export interface EstadoNombreUsuario {
  nombre: string
  puedeEditar: boolean
  disponibleDesde: string | null
}

export async function obtenerEstadoNombre(signal: AbortSignal): Promise<EstadoNombreUsuario> {
  const { data } = await api.get<EstadoNombreUsuario>('/auth/nombre', { signal })
  return data
}

export async function guardarNombreUsuario(nombre: string): Promise<EstadoNombreUsuario> {
  const { data } = await api.put<EstadoNombreUsuario>('/auth/nombre', { nombre })
  return data
}

export async function obtenerPerfilCuenta(signal?: AbortSignal): Promise<PerfilCuenta | null> {
  try {
    const { data } = await api.get<PerfilCuenta>('/auth/perfil', { signal })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function guardarDatosComerciales(datos: DatosComerciales): Promise<PerfilCuenta> {
  const { data } = await api.put<PerfilCuenta>('/auth/perfil', datos)
  return data
}

export async function obtenerLogoCuenta(signal?: AbortSignal): Promise<Blob> {
  const { data } = await api.get<Blob>('/auth/logo', { signal, responseType: 'blob' })
  return data
}

export async function guardarLogoCuenta(logo: File): Promise<void> {
  const datos = new FormData()
  datos.append('logo', logo)
  await api.put('/auth/logo', datos)
}

export async function eliminarLogoCuenta(): Promise<void> {
  await api.delete('/auth/logo')
}
export async function obtenerFotoPerfil(signal: AbortSignal): Promise<Blob | null> {
  try {
    const { data } = await api.get<Blob>('/auth/foto', { responseType: 'blob', signal })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function guardarFotoPerfil(foto: File): Promise<void> {
  const datos = new FormData()
  datos.append('foto', foto)
  await api.put('/auth/foto', datos)
}
