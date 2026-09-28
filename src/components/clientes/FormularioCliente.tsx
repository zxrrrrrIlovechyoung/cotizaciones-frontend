import { useState } from 'react'

import CampoForm from '@/components/cotizaciones/CampoForm'
import { TIPOS_CLIENTE, formatTel, toTitleCase } from '@/data/cotizaciones'
import { clienteVacio, registrarCliente } from '@/data/clientes'

export default function FormularioCliente({ onVolver, onGuardado }: { onVolver: () => void; onGuardado: () => void }) {
  const [formulario, setFormulario] = useState(clienteVacio())
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  function update<K extends keyof typeof formulario>(campo: K, valor: (typeof formulario)[K]) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function validar() {
    const next: Record<string, string> = {}
    if (!formulario.nombreComercial.trim()) next.nombreComercial = 'Escribe el nombre del cliente.'
    if (formulario.telefonoContacto.replace(/\D/g, '').length !== 10) next.telefonoContacto = 'El teléfono debe tener 10 dígitos.'
    if (formulario.correoContacto && !/^\S+@\S+\.\S+$/.test(formulario.correoContacto)) next.correoContacto = 'El correo no tiene un formato válido.'
    setErrores(next)
    return Object.keys(next).length === 0
  }

  async function guardar(event: React.FormEvent) {
    event.preventDefault()
    if (guardando || !validar()) return
    setGuardando(true)
    await new Promise((r) => setTimeout(r, 500))
    registrarCliente({ ...formulario })
    setGuardando(false)
    setGuardado(true)
    setTimeout(onGuardado, 1000)
  }

  return (
    <form className="form form--compacta" noValidate onSubmit={guardar}>
      <header className="form__head"><button type="button" className="icon-btn" onClick={onVolver}><i className="mdi mdi-arrow-left" /></button><div><h2>Nuevo cliente</h2><p>Se agrega al directorio y queda disponible al cotizar</p></div></header>
      <section className="panel">
        <div className="grid grid--tipo"><CampoForm label="Tipo de cliente"><select value={formulario.tipoCliente} className="ui-select" onChange={(e) => update('tipoCliente', e.target.value)}>{TIPOS_CLIENTE.map((t) => <option key={t}>{t}</option>)}</select></CampoForm><CampoForm label="Nombre de la empresa / cliente *" error={errores.nombreComercial}><input value={formulario.nombreComercial} className={`ui-input ${errores.nombreComercial ? 'is-error' : ''}`} placeholder="Ej. Transportes del Bajío" maxLength={45} onChange={(e) => update('nombreComercial', toTitleCase(e.target.value))} /></CampoForm></div>
        <div className="grid grid--2"><CampoForm label="Atención a" ayuda="Nombre de quien atiende o autoriza en el taller."><input value={formulario.atencionA} className="ui-input" placeholder="Ej. Julio Navarro" maxLength={45} onChange={(e) => update('atencionA', toTitleCase(e.target.value))} /></CampoForm><CampoForm label="RFC (opcional)"><input value={formulario.rfc} className="ui-input rfc" placeholder="Ej. XAXX010101000" maxLength={13} onChange={(e) => update('rfc', e.target.value.toUpperCase().replace(/[^A-Z0-9&]/g, ''))} /></CampoForm></div>
        <div className="grid grid--2"><CampoForm label="Correo electrónico (opcional)" error={errores.correoContacto}><input value={formulario.correoContacto} type="email" className={`ui-input ${errores.correoContacto ? 'is-error' : ''}`} placeholder="contacto@cliente.com" maxLength={40} onChange={(e) => update('correoContacto', e.target.value)} /></CampoForm><CampoForm label="Teléfono *" error={errores.telefonoContacto}><input value={formulario.telefonoContacto} className={`ui-input ${errores.telefonoContacto ? 'is-error' : ''}`} placeholder="773 185 1363" inputMode="numeric" maxLength={12} onChange={(e) => update('telefonoContacto', formatTel(e.target.value))} /></CampoForm></div>
      </section>
      <div className="nav"><button type="button" className="ui-btn" onClick={onVolver}>Cancelar</button><button type="submit" className="ui-btn ui-btn--primary guardar" disabled={guardando}>{guardando ? <span className="spinner" /> : 'Registrar cliente'}</button></div>
      {guardado && <div className="exito"><div className="exito__caja"><div className="exito__circulo"><i className="mdi mdi-check" /></div><div className="exito__titulo">Cliente registrado con éxito</div><div className="exito__nota">(demo — todavía no se guarda en base de datos)</div></div></div>}
    </form>
  )
}
