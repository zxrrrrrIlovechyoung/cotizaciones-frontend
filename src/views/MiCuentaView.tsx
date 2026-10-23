import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
