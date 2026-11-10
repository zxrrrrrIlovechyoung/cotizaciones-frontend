import { useCallback, useEffect, useState } from 'react'

import AlertaExito from '@/components/AlertaExito'
import AppShell from '@/components/AppShell'
import EditarDatosComerciales from '@/components/EditarDatosComerciales'
import EditarInformacionCuenta from '@/components/EditarInformacionCuenta'
import FotoPerfil from '@/components/FotoPerfil'
import { formatTel } from '@/data/cotizaciones'
import api from '@/services/api'
import { obtenerLogoCuenta, obtenerPerfilCuenta, type PerfilCuenta } from '@/services/perfilCuenta'
import { useAuth } from '@/stores/auth'

interface Perfil {
  id: number
  nombre: string
  email: string
  created_at?: string
}

function DatoCuenta({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt>{etiqueta}</dt>
      <dd className={valor ? undefined : 'cuenta__datoVacio'}>{valor || 'Sin registrar'}</dd>
    </div>
  )
}

export default function MiCuentaView() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<Perfil | null>(user)
  const [perfilCuenta, setPerfilCuenta] = useState<PerfilCuenta | null | undefined>(undefined)
  const [errorPerfilCuenta, setErrorPerfilCuenta] = useState(false)
  const [logo, setLogo] = useState('')
  const [errorLogo, setErrorLogo] = useState(false)
  const [editarInformacion, setEditarInformacion] = useState(false)
  const [editarComercial, setEditarComercial] = useState(false)
  const [confirmacion, setConfirmacion] = useState<'nombre' | 'comercial' | null>(null)
  const cerrarExito = useCallback(() => setConfirmacion(null), [])

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

  useEffect(() => {
    const controller = new AbortController()
    let urlLogo = ''

    async function cargarPerfilCuenta() {
      let datos: PerfilCuenta | null
      try {
        datos = await obtenerPerfilCuenta(controller.signal)
        if (controller.signal.aborted) return
        setPerfilCuenta(datos)
      } catch {
        if (!controller.signal.aborted) setErrorPerfilCuenta(true)
        return
      }
      if (!datos?.tieneLogo) return
      try {
        const imagen = await obtenerLogoCuenta(controller.signal)
        if (controller.signal.aborted) return
        urlLogo = URL.createObjectURL(imagen)
        setLogo(urlLogo)
      } catch {
        if (!controller.signal.aborted) setErrorLogo(true)
      }
    }

    void cargarPerfilCuenta()
    return () => {
      controller.abort()
      if (urlLogo) URL.revokeObjectURL(urlLogo)
    }
  }, [])

  const nombre = perfil?.nombre ?? 'Usuario'
  const email = perfil?.email ?? 'Cuenta activa'
  const iniciales = nombre.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const cuentaCreada = perfil?.created_at
    ? new Date(perfil.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <AppShell mostrarBarraSuperior={false}>
      <div className="ws">
        <div className="ws__head ws__head--sinAccion"><div className="ws__titles"><h2>Mi cuenta</h2><p>Perfil y datos de tu actividad comercial</p></div></div>
        <div className="ws__body cuenta__body">
          <div className="cuenta">
            <section className="cuenta__card" aria-labelledby="informacion-cuenta">
              <header className="cuenta__encabezado">
                <h3 id="informacion-cuenta">Información de la cuenta</h3>
                <button type="button" className="ui-btn cuenta__editar" onClick={() => setEditarInformacion(true)}>
                  <i className="mdi mdi-pencil-outline" aria-hidden="true" /> Editar información
                </button>
              </header>
              <div className="cuenta__identidad">
                <FotoPerfil iniciales={iniciales} />
                <div>
                  <span className="cuenta__identidadEtiqueta">Nombre de usuario</span>
                  <strong>{nombre}</strong>
                  <span className="cuenta__identidadEtiqueta">Correo electrónico</span>
                  <p>{email}</p>
                  {cuentaCreada && <small>Cuenta creada el {cuentaCreada}</small>}
                </div>
              </div>
            </section>

            <section className="cuenta__card" aria-labelledby="datos-actividad">
              <header className="cuenta__encabezado">
                {logo
                  ? <img className="cuenta__logo" src={logo} alt="Logo comercial registrado" onError={() => { setLogo(''); setErrorLogo(true) }} />
                  : <i className="cuenta__icono mdi mdi-card-account-details-outline" aria-hidden="true" />}
                <div>
                  <h3 id="datos-actividad">{perfilCuenta?.tipo === 'Empresa' ? 'Datos de la empresa' : 'Datos comerciales'}</h3>
                  <p>Información fiscal, de contacto e identidad comercial</p>
                  {errorLogo && <p role="status">No se pudo cargar el logo comercial.</p>}
                </div>
                {perfilCuenta && <button type="button" className="ui-btn cuenta__editar" aria-label="Editar datos comerciales" onClick={() => setEditarComercial(true)}>
                  <i className="mdi mdi-pencil-outline" aria-hidden="true" /> Editar datos
                </button>}
              </header>
              {errorPerfilCuenta ? <p className="cuenta__nota" role="alert">No se pudieron cargar los datos de actividad.</p>
                : perfilCuenta === undefined ? <p className="cuenta__nota" role="status">Cargando datos de actividad…</p>
                : perfilCuenta === null ? <p className="cuenta__nota">Esta cuenta todavía no tiene datos de actividad registrados.</p>
                : <div className="cuenta__comercial">
                  <div className="cuenta__grupo">
                    <h4>Identidad comercial</h4>
                    <dl className="cuenta__datos">
                      <DatoCuenta etiqueta={perfilCuenta.tipo === 'Empresa' ? 'Nombre comercial' : 'Nombre profesional o comercial'} valor={perfilCuenta.comercial} />
                      <DatoCuenta etiqueta="Tipo de cuenta" valor={perfilCuenta.tipo} />
                      {perfilCuenta.tipo === 'Empresa' && <DatoCuenta etiqueta="Razón social" valor={perfilCuenta.razonSocial} />}
                      <DatoCuenta etiqueta="RFC" valor={perfilCuenta.rfc} />
                    </dl>
                  </div>
                  <div className="cuenta__grupo">
                    <h4>Contacto</h4>
                    <dl className="cuenta__datos">
                      <DatoCuenta etiqueta="Teléfono de contacto" valor={formatTel(perfilCuenta.telefono)} />
                      <DatoCuenta etiqueta="Dirección comercial" valor={perfilCuenta.direccion} />
                    </dl>
                  </div>
                </div>}
            </section>
          </div>
        </div>
      </div>
      {editarInformacion && <EditarInformacionCuenta onCerrar={() => setEditarInformacion(false)} onGuardado={(nombreNuevo) => {
        setPerfil((anterior) => anterior ? { ...anterior, nombre: nombreNuevo } : anterior)
        setEditarInformacion(false)
        setConfirmacion('nombre')
      }} />}
      {editarComercial && <EditarDatosComerciales onCerrar={() => setEditarComercial(false)} onGuardado={(datos) => {
        setPerfilCuenta(datos)
        setEditarComercial(false)
        setConfirmacion('comercial')
      }} />}
      {confirmacion && <AlertaExito titulo={confirmacion === 'nombre' ? 'Nombre actualizado' : 'Datos comerciales actualizados'}
        mensaje={confirmacion === 'nombre' ? 'Se guardó tu nombre de usuario.' : 'Se guardaron tus datos comerciales.'}
        accion="Aceptar" onContinuar={cerrarExito} />}
    </AppShell>
  )
}
