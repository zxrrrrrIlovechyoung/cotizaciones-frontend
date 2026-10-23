import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import AppShell from '@/components/AppShell'
import api from '@/services/api'
import { useAuth } from '@/stores/auth'

interface Perfil {
  id: number
  nombre: string
  email: string
  created_at?: string
}

export default function MiCuentaView() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState<Perfil | null>(user)
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errP, setErrP] = useState<Record<string, string>>({})
  const [guardandoP, setGuardandoP] = useState(false)
  const [avisoP, setAvisoP] = useState<{ texto: string; ok: boolean } | null>(null)

  // Datos frescos del usuario desde la API (incluye la fecha de alta). Si falla,
  // se queda con los datos de la sesión guardada.
  useEffect(() => {
    let activo = true
    api
      .get<Perfil>('/auth/me')
      .then(({ data }) => activo && setPerfil(data))
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  const nombre = perfil?.nombre ?? 'Usuario'
  const email = perfil?.email ?? 'Cuenta activa'
  const iniciales = nombre.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const cuentaCreada = perfil?.created_at
    ? new Date(perfil.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  function validarPassword() {
    const e: Record<string, string> = {}
    if (!actual) e.actual = 'Ingresa tu contraseña actual.'
    if (nueva.length < 6) e.nueva = 'Debe tener al menos 6 caracteres.'
    if (confirmar !== nueva) e.confirmar = 'Las contraseñas no coinciden.'
    setErrP(e)
    return Object.keys(e).length === 0
  }

  async function cambiarContrasena(ev: React.FormEvent) {
    ev.preventDefault()
    if (guardandoP || !validarPassword()) return
    setGuardandoP(true)
    setAvisoP(null)
    try {
      // skipAuthRedirect: un 401 aquí significa "contraseña actual incorrecta",
      // no una sesión expirada, así que no debe cerrar la sesión.
      await api.put('/auth/password', { actual, nueva }, { skipAuthRedirect: true })
      setAvisoP({ texto: 'Contraseña actualizada correctamente.', ok: true })
      setActual('')
      setNueva('')
      setConfirmar('')
    } catch (err) {
      let texto = 'No se pudo cambiar la contraseña. Intenta de nuevo.'
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) texto = 'La contraseña actual es incorrecta.'
        else if (err.response?.status === 400 && err.response.data?.error) texto = err.response.data.error as string
      }
      setAvisoP({ texto, ok: false })
    } finally {
      setGuardandoP(false)
    }
  }

  function cerrarSesion() {
    logout()
    navigate('/login')
  }

  return (
    <AppShell>
      <div className="ws">
        <div className="ws__head ws__head--sinAccion"><div className="ws__titles"><h2>Mi cuenta</h2><p>Información de tu perfil y tu sesión</p></div></div>
        <div className="ws__body">
          <div className="cuenta">
            <section className="cuenta__card">
              <div className="cuenta__perfil">
                <div className="cuenta__avatar">{iniciales || <i className="mdi mdi-account-outline" />}</div>
                <div className="cuenta__ident">
                  <strong>{nombre}</strong>
                  <span>{email}</span>
                  <span className="cuenta__rol">Administrador</span>
                </div>
              </div>
              <div className="cuenta__datos">
                <div><span>Correo</span><strong>{email}</strong></div>
                {cuentaCreada ? <div><span>Cuenta creada</span><strong>{cuentaCreada}</strong></div> : null}
              </div>
            </section>

            <section className="cuenta__card">
              <div className="cuenta__cardTitulo"><i className="mdi mdi-shield-lock-outline" /><span>Seguridad</span></div>
              <p className="cuenta__nota">Cambia tu contraseña. Deberás ingresar la actual para confirmar.</p>
              <form className="cuenta__form" noValidate onSubmit={cambiarContrasena}>
                <label className="cuenta__field">
                  <span>Contraseña actual</span>
                  <input type="password" autoComplete="current-password" className={`ui-input ${errP.actual ? 'is-error' : ''}`} value={actual} onChange={(e) => setActual(e.target.value)} />
                  {errP.actual ? <small className="cuenta__fieldErr">{errP.actual}</small> : null}
                </label>
                <label className="cuenta__field">
                  <span>Nueva contraseña</span>
                  <input type="password" autoComplete="new-password" className={`ui-input ${errP.nueva ? 'is-error' : ''}`} value={nueva} onChange={(e) => setNueva(e.target.value)} />
                  {errP.nueva ? <small className="cuenta__fieldErr">{errP.nueva}</small> : null}
                </label>
                <label className="cuenta__field">
                  <span>Confirmar nueva contraseña</span>
                  <input type="password" autoComplete="new-password" className={`ui-input ${errP.confirmar ? 'is-error' : ''}`} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
                  {errP.confirmar ? <small className="cuenta__fieldErr">{errP.confirmar}</small> : null}
                </label>
                {avisoP ? <div className={`cuenta__aviso ${avisoP.ok ? 'is-ok' : 'is-error'}`}><i className={`mdi ${avisoP.ok ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'}`} /> {avisoP.texto}</div> : null}
                <button type="submit" className="ui-btn ui-btn--primary" disabled={guardandoP}>{guardandoP ? 'Guardando…' : 'Cambiar contraseña'}</button>
              </form>
            </section>

            <section className="cuenta__card">
              <div className="cuenta__cardTitulo"><i className="mdi mdi-logout" /><span>Sesión</span></div>
              <p className="cuenta__nota">Cierra tu sesión en este dispositivo.</p>
              <button type="button" className="ui-btn cuenta__logout" onClick={cerrarSesion}><i className="mdi mdi-logout" /> Cerrar sesión</button>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
