import api from './api'

export const COLOR_DOCUMENTO_PREDETERMINADO = '#1b4ed8'
export const esColorDocumento = (valor: string) => /^#[0-9a-f]{6}$/i.test(valor)

export const FUENTES_DOCUMENTO = {
  arial: { nombre: 'Arial', familia: 'Arial, sans-serif' },
  verdana: { nombre: 'Verdana', familia: 'Verdana, Arial, sans-serif' },
  georgia: { nombre: 'Georgia', familia: 'Georgia, serif' },
  times: { nombre: 'Times New Roman', familia: '"Times New Roman", Times, serif' },
} as const

export type FuenteDocumento = keyof typeof FUENTES_DOCUMENTO
export const esFuenteDocumento = (valor: string): valor is FuenteDocumento => Object.prototype.hasOwnProperty.call(FUENTES_DOCUMENTO, valor)

export interface ConfiguracionDocumento {
  color: string
  fuente: FuenteDocumento
}

export const CONFIGURACION_DOCUMENTO_PREDETERMINADA: ConfiguracionDocumento = {
  color: COLOR_DOCUMENTO_PREDETERMINADO,
  fuente: 'arial',
}

export async function obtenerConfiguracionDocumento(signal: AbortSignal): Promise<ConfiguracionDocumento> {
  const { data } = await api.get<ConfiguracionDocumento>('/configuracion/documento', { signal })
  return data
}

export async function guardarConfiguracionDocumento(configuracion: ConfiguracionDocumento): Promise<ConfiguracionDocumento> {
  const { data } = await api.put<ConfiguracionDocumento>('/configuracion/documento', configuracion)
  return data
}
