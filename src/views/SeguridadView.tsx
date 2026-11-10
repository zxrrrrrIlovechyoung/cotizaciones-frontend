import { useCallback, useState, type ComponentProps, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import AlertaExito from '@/components/AlertaExito'
import AppHeader from '@/components/AppHeader'
import CambiarContrasena from '@/components/configuracion/CambiarContrasena'
import EliminarCuenta from '@/components/configuracion/EliminarCuenta'
import IconoConfiguracion from '@/components/configuracion/IconoConfiguracion'
import RecuperarContrasena from '@/components/configuracion/RecuperarContrasena'
import { useAuth } from '@/stores/auth'

function OpcionSeguridad({ icono, titulo, descripcion, children }: {
  icono: ComponentProps<typeof IconoConfiguracion>['icono']
  titulo: string
  descripcion: string
  children?: ReactNode
}) {
  return (
    <li className="configuracion__filaSeguridad">
      <IconoConfiguracion icono={icono} />
      <div className="configuracion__opcionTitulo">
        <h3>{titulo}</h3>
        <p>{descripcion}</p>
      </div>
      {children}
    </li>
  )
}

export default function SeguridadView() {
  const { user, logout } = useAuth()
  const [editarContrasena, setEditarContrasena] = useState(false)
  const [recuperarContrasena, setRecuperarContrasena] = useState(false)
  const [eliminarCuenta, setEliminarCuenta] = useState(false)
  const [contrasenaGuardada, setContrasenaGuardada] = useState(false)
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorSesion, setErrorSesion] = useState('')
  const cerrarExito = useCallback(() => setContrasenaGuardada(false), [])
  const volverAlLogin = useCallback(() => {
    void logout().catch(() => window.location.replace('/login'))
  }, [logout])

  async function cerrarSesion() {
    if (cerrandoSesion) return
    setCerrandoSesion(true)
    setErrorSesion('')
    try {
      await logout()
    } catch {
      setErrorSesion('No se pudo cerrar la sesión. Intenta de nuevo.')
      setCerrandoSesion(false)
    }
  }

  return (
    <>
      <div className="ws configuracion__vista">
        <div className="ws__head ws__head--sinAccion">
          <Link className="topbar__back" to="/configuracion" aria-label="Volver a Configuración" title="Volver a Configuración" viewTransition>
            <IconoConfiguracion icono="volver" />
          </Link>
          <div className="ws__titles"><h2>Contraseña y sesión</h2><p>Administra el acceso a tu cuenta.</p></div>
          <AppHeader integrado mostrarCrearCotizacion={false} />
        </div>
        <div className="ws__body configuracion">
          <ul className="configuracion__lista" aria-label="Opciones de seguridad">
            <OpcionSeguridad icono="candado" titulo="Cambiar contraseña" descripcion="Actualiza tu contraseña con la que usas actualmente.">
              <button className="ui-btn ui-btn--primary" type="button" onClick={() => setEditarContrasena(true)} aria-label="Cambiar contraseña">
                Cambiar
              </button>
            </OpcionSeguridad>
            <OpcionSeguridad icono="recuperar" titulo="Olvidé mi contraseña" descripcion="Recupera el acceso mediante tu correo electrónico.">
              <button className="ui-btn" type="button" disabled={!user?.email} onClick={() => setRecuperarContrasena(true)}>Recuperar</button>
            </OpcionSeguridad>
            <OpcionSeguridad icono="salir" titulo="Cerrar sesión" descripcion="Finaliza la sesión en este dispositivo.">
              <button className="ui-btn" type="button" onClick={cerrarSesion} disabled={cerrandoSesion}>
                {cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
              </button>
            </OpcionSeguridad>
            <OpcionSeguridad icono="eliminar" titulo="Eliminar mi cuenta" descripcion="Elimina definitivamente tu cuenta y los datos asociados.">
              <button className="ui-btn modal__borrar" type="button" disabled={!user?.email} onClick={() => setEliminarCuenta(true)}>Eliminar</button>
            </OpcionSeguridad>
          </ul>
          {errorSesion && <p className="campo__error" role="alert">{errorSesion}</p>}
        </div>
      </div>
      {editarContrasena && <CambiarContrasena onCerrar={() => setEditarContrasena(false)} onGuardado={() => {
        setEditarContrasena(false)
        setContrasenaGuardada(true)
      }} />}
      {contrasenaGuardada && <AlertaExito titulo="Contraseña actualizada" mensaje="Se guardó tu nueva contraseña." accion="Aceptar" onContinuar={cerrarExito} />}
      {recuperarContrasena && <RecuperarContrasena correoInicial={user?.email} correoFijo
        onCerrar={() => setRecuperarContrasena(false)} onFinalizar={volverAlLogin} />}
      {eliminarCuenta && user && <EliminarCuenta correo={user.email}
        onCerrar={() => setEliminarCuenta(false)} onEliminada={volverAlLogin} />}
    </>
  )
}
