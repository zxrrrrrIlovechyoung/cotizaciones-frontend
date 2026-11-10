export const MAX_CARACTERES_CONTRASENA = 20

export const reglasContrasena = [
  { label: 'De 8 a 20 caracteres', test: (valor: string) => {
    const longitud = Array.from(valor).length
    return longitud >= 8 && longitud <= MAX_CARACTERES_CONTRASENA
  } },
  { label: 'Una mayúscula', test: (valor: string) => /\p{Lu}/u.test(valor) },
  { label: 'Una minúscula', test: (valor: string) => /\p{Ll}/u.test(valor) },
  { label: 'Un número', test: (valor: string) => /\p{Nd}/u.test(valor) },
  { label: 'Un carácter especial', test: (valor: string) => /[^\p{L}\p{Nd}\p{White_Space}]/u.test(valor) },
]

export function longitudContrasenaAdmitida(valor: string) {
  return new TextEncoder().encode(valor).length <= 72
}

export function limitarContrasena(valor: string) {
  return Array.from(valor).slice(0, MAX_CARACTERES_CONTRASENA).join('')
}
