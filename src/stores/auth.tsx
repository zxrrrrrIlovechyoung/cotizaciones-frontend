import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import api, { setAccessToken } from '@/services/api'
import { guardarFotoPerfil, guardarNombreUsuario, obtenerFotoPerfil } from '@/services/perfilCuenta'

interface User {
  id: number
  nombre: string
  email: string
}

interface AuthContextValue {
  token: string | null
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fotoPerfilUrl: string
  cargandoFotoPerfil: boolean
  errorFotoPerfil: boolean
  actualizarFotoPerfil: (archivo: File) => Promise<void>
  actualizarNombreUsuario: (nombre: string) => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [foto, setFoto] = useState<{ id: number; archivo: Blob | null; error?: boolean } | null>(null)
  const [vistaFoto, setVistaFoto] = useState<{ archivo: Blob; url: string } | null>(null)
  const usuarioId = user?.id
  const fotoActual = foto?.id === usuarioId ? foto?.archivo : null

  useEffect(() => {
    if (usuarioId === undefined) return
    const controller = new AbortController()
    obtenerFotoPerfil(controller.signal)
      .then((archivo) => { if (!controller.signal.aborted) setFoto({ id: usuarioId, archivo }) })
      .catch(() => { if (!controller.signal.aborted) setFoto({ id: usuarioId, archivo: null, error: true }) })
    return () => controller.abort()
  }, [usuarioId])

  useEffect(() => {
    if (!fotoActual) {
      setVistaFoto(null)
      return
    }
    const url = URL.createObjectURL(fotoActual)
    setVistaFoto({ archivo: fotoActual, url })
    return () => URL.revokeObjectURL(url)
  }, [fotoActual])

  async function actualizarFotoPerfil(archivo: File) {
    await guardarFotoPerfil(archivo)
    setFoto((anterior) => anterior && anterior.id === usuarioId ? { id: anterior.id, archivo } : anterior)
  }

  async function actualizarNombreUsuario(nombre: string) {
    const estado = await guardarNombreUsuario(nombre)
    setUser((anterior) => anterior && anterior.id === usuarioId ? { ...anterior, nombre: estado.nombre } : anterior)
    return estado.nombre
  }
  useEffect(() => {
    localStorage.removeItem('token'); localStorage.removeItem('user')
    let active = true
    api.get<{ token: string; user: User }>('/auth/session', { skipAuthRedirect: true })
      .then(({data}) => { if (active) { setAccessToken(data.token); setToken(data.token); setUser(data.user) } })
      .catch(() => { if (active) { setAccessToken(null); setToken(null); setUser(null) } })
      .finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [])

  async function login(email: string, password: string) {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    })

    setToken(data.token)
    setUser(data.user)
    setAccessToken(data.token)
  }

  async function logout() {
    await api.post('/auth/logout')
    setAccessToken(null)
    setToken(null)
    setUser(null)
    setFoto(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = useMemo(() => ({
    token, user, ready, login, logout, actualizarFotoPerfil, actualizarNombreUsuario,
    fotoPerfilUrl: vistaFoto && vistaFoto.archivo === fotoActual ? vistaFoto.url : '',
    cargandoFotoPerfil: usuarioId !== undefined && foto?.id !== usuarioId,
    errorFotoPerfil: foto?.id === usuarioId && Boolean(foto?.error),
  }), [token, user, ready, foto, vistaFoto, fotoActual, usuarioId])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
