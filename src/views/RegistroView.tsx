import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import axios from 'axios'
import '@/styles/registro.css'
import api from '@/services/api'
import { limitarContrasena, longitudContrasenaAdmitida, MAX_CARACTERES_CONTRASENA, reglasContrasena as passwordRules } from '@/data/contrasena'
import { LIMITES_PERFIL_CUENTA } from '@/services/perfilCuenta'

const validEmail = (value: string) => value.length <= 100 && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(value)


export default function RegistroView() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmar: '', tipo: 'Empresa', comercial: '', razonSocial: '', rfc: '', telefono: '', direccion: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [visible, setVisible] = useState(false)
  const [logo, setLogo] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [review, setReview] = useState(false)
  const [saving, setSaving] = useState(false)
  const successButton = useId()
  useEffect(() => {
    if (!review) return
    document.getElementById(successButton)?.focus()
    const timer = window.setTimeout(() => navigate('/login', { replace: true }), 3000)
    return () => window.clearTimeout(timer)
  }, [review, navigate, successButton])
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'error'>('idle')
  const score = form.password ? passwordRules.filter((rule) => rule.test(form.password)).length : 0
  useEffect(() => {
    const email = form.email.trim().toLowerCase()
    if (!validEmail(email)) { setEmailStatus('idle'); return }
    const controller = new AbortController()
    setEmailStatus('checking')
    const timer = window.setTimeout(() => {
      api.post<{ disponible: boolean }>('/auth/email-disponible', { email }, { signal: controller.signal })
        .then(({ data }) => { if (!controller.signal.aborted) setEmailStatus(data.disponible ? 'available' : 'taken') })
        .catch(() => { if (!controller.signal.aborted) setEmailStatus('error') })
    }, 500)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [form.email])
  const fileId = useId()
  useEffect(() => {
    if (!logo) { setPreview(''); return }
    const url = URL.createObjectURL(logo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logo])
  function update(key: keyof typeof form, value: string) {
    if (key === 'password' || key === 'confirmar') value = limitarContrasena(value)
    if (key === 'telefono') value = value.replace(/[^0-9]/g, '').slice(0, 10)
    if (key === 'email') setEmailStatus('idle')
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setReview(false)
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving || review) return
    const next: Record<string, string> = {}
    if (step === 0) {
      if (form.nombre.trim().length < 2) next.nombre = 'Escribe tu nombre completo.'
      if (Array.from(form.nombre).length > 60) next.nombre = 'Máximo 60 caracteres.'
      if (!validEmail(form.email.trim())) next.email = 'Ingresa un correo válido.'
      else if (emailStatus !== 'available') next.email = emailStatus === 'taken' ? 'Este correo ya está registrado.' : 'Espera la comprobación del correo o vuelve a intentarlo.'
      if (score < passwordRules.length || !longitudContrasenaAdmitida(form.password)) next.password = 'Usa de 8 a 20 caracteres y cumple las reglas indicadas.'
      if (form.password !== form.confirmar || !form.confirmar) next.confirmar = 'Las contraseñas deben coincidir.'
    }
    if (step === 1) {
      const { comercial, razonSocial, direccion } = LIMITES_PERFIL_CUENTA
      if (Array.from(form.comercial.trim()).length < 2 || Array.from(form.comercial.trim()).length > comercial) next.comercial = `Usa entre 2 y ${comercial} caracteres.`
      if (form.tipo === 'Empresa' && (Array.from(form.razonSocial.trim()).length < 2 || Array.from(form.razonSocial.trim()).length > razonSocial)) next.razonSocial = `Usa entre 2 y ${razonSocial} caracteres.`
      if (Array.from(form.direccion.trim()).length > direccion) next.direccion = `Máximo ${direccion} caracteres.`
      if (Array.from(form.rfc).length > 13) next.rfc = 'Máximo 13 caracteres.'
      if (!form.comercial.trim()) next.comercial = 'Indica el nombre que aparecerá en tus cotizaciones.'
      if (form.tipo === 'Empresa' && !form.razonSocial.trim()) next.razonSocial = 'Escribe la razón social.'
      if (form.telefono && form.telefono.replace(/\D/g, '').length !== 10) next.telefono = 'Ingresa 10 dígitos.'
    }
    setErrors(next)
    if (Object.keys(next).length) return
    if (step === 0) {
      try { await api.post('/auth/validar-registro', { nombre: form.nombre, email: form.email, password: form.password }) }
      catch { setErrors({ nombre: 'No se pudieron validar los datos. Revisa los límites e inténtalo de nuevo.' }); return }
    }
    if (step === 1) {
      try { await api.post('/auth/validar-actividad', { tipo: form.tipo, comercial: form.comercial, razonSocial: form.tipo === 'Empresa' ? form.razonSocial : '', rfc: form.rfc, telefono: form.telefono, direccion: form.direccion }) }
      catch { setErrors({ comercial: 'No se pudo validar la información comercial. Revisa los campos e inténtalo de nuevo.' }); return }
    }
    if (step < 2) setStep(step + 1)
    else {
      setSaving(true)
      const payload = new FormData()
      payload.append('datos', JSON.stringify({ ...form, email: form.email.trim().toLowerCase(), razonSocial: form.tipo === 'Empresa' ? form.razonSocial : '' }))
      if (logo) payload.append('logo', logo)
      try {
        await api.post('/auth/registro', payload)
        setReview(true)
        setForm((current) => ({ ...current, password: '', confirmar: '' }))
      } catch (error) {
        setErrors({ general: axios.isAxiosError(error) ? error.response?.data?.error ?? 'No se pudo crear la cuenta. Inténtalo de nuevo.' : 'No se pudo crear la cuenta.' })
      } finally { setSaving(false) }
    }
  }
  function field(key: keyof typeof form, label: string, type = 'text', maxLength = 150) {
    if (key === 'nombre') maxLength = 60
    if (key === 'email') maxLength = 100
    if (key === 'password' || key === 'confirmar') maxLength = MAX_CARACTERES_CONTRASENA * 2
    if (key === 'comercial' || key === 'razonSocial' || key === 'direccion') maxLength = LIMITES_PERFIL_CUENTA[key]
    if (key === 'telefono') maxLength = 10
    if (key === 'rfc') maxLength = 13
    const invalidEmail = key === 'email' && Boolean(form.email) && !validEmail(form.email.trim())
    return <label className="registration__field"><span>{label}</span><input type={type} value={form[key]} maxLength={maxLength} autoComplete={key === 'email' ? 'email' : key === 'nombre' ? 'name' : type === 'password' ? 'new-password' : undefined} aria-invalid={Boolean(errors[key]) || invalidEmail || (key === 'email' && emailStatus === 'taken')} onChange={(e) => update(key, key === 'rfc' ? e.target.value.toUpperCase() : e.target.value)} />{errors[key] && <small role="alert">{errors[key]}</small>}{key === 'email' && form.email && !errors.email && <span className={`registration__email-status status-${invalidEmail ? 'invalid' : emailStatus}`} role="status">{invalidEmail ? 'Ingresa un correo válido' : ({ idle: '', checking: 'Comprobando correo…', available: 'Correo disponible', taken: 'Este correo ya tiene una cuenta.', error: 'No se pudo comprobar. Edita el correo para reintentar.' })[emailStatus]}</span>}</label>
  }
  return <main className="registration">
    {review && createPortal(<div className="registration-success"><section className="registration-success__dialog" role="dialog" aria-modal="true" aria-labelledby="registration-success-title" aria-describedby="registration-success-description" onKeyDown={(event) => { if (event.key === 'Tab') { event.preventDefault(); document.getElementById(successButton)?.focus() } if (event.key === 'Escape') navigate('/login', { replace: true }) }}><div className="registration-success__icon"><i className="mdi mdi-check" aria-hidden="true" /></div><h2 id="registration-success-title">¡Cuenta creada!</h2><p id="registration-success-description">Tu cuenta está lista. En un momento te llevaremos al inicio de sesión.</p><button id={successButton} type="button" onClick={() => navigate('/login', { replace: true })}>Iniciar sesión</button></section></div>, document.body)}
    <section className="registration__panel">
      <div className="registration__body">
        <h1>Crea tu cuenta</h1><p className="registration__subtitle">{['Comienza con tus datos de acceso.', 'Cuéntanos cómo trabajas.', 'Dale identidad a tus cotizaciones.'][step]}</p>
        <form onSubmit={submit} noValidate>
          {step === 0 && <>{field('nombre', 'Nombre completo')}{field('email', 'Correo electrónico', 'email', 120)}<div className="registration__password">{field('password', 'Contraseña', visible ? 'text' : 'password', 72)}<button type="button" title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVisible(!visible)}><i className={`mdi ${visible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'}`} /></button></div>{field('confirmar', 'Confirmar contraseña', visible ? 'text' : 'password', 72)}<p className="registration__hint">Mínimo 8 caracteres. Puedes usar una frase larga.</p></>}
          {step === 1 && <><fieldset className="registration__types"><legend>Tipo de cuenta</legend>{['Empresa', 'Persona'].map((type) => <label key={type} className={form.tipo === type ? 'is-selected' : ''}><input type="radio" name="tipo" value={type} checked={form.tipo === type} onChange={() => update('tipo', type)} /><i className={`mdi ${type === 'Empresa' ? 'mdi-office-building-outline' : 'mdi-account-outline'}`} />{type}</label>)}</fieldset>{field('comercial', form.tipo === 'Empresa' ? 'Nombre comercial *' : 'Nombre profesional o comercial *')}{form.tipo === 'Empresa' && field('razonSocial', 'Razón social *')}{field('rfc', 'RFC (opcional)', 'text', 13)}{field('telefono', 'Teléfono de contacto (opcional)', 'tel', 20)}{field('direccion', 'Dirección comercial (opcional)')}</>}
          {step === 2 && <><div className="registration__logo"><div>{preview ? <img src={preview} alt="Vista previa del logo" /> : <i className="mdi mdi-image-outline" />}</div>{!review && <><label htmlFor={fileId}>Seleccionar logo</label><input id={fileId} disabled={saving} type="file" accept="image/png,image/jpeg" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) { setErrors({ logo: 'Selecciona PNG o JPG de hasta 2 MB.' }); return } setLogo(file); setErrors({}) }} />{logo && <button disabled={saving} type="button" onClick={() => setLogo(null)}>Quitar</button>}</>}</div><p className="registration__hint">Logo opcional · PNG o JPG · Máximo 2 MB</p>{errors.logo && <p role="alert" className="registration__error">{errors.logo}</p>}<dl className="registration__summary"><dt>Cuenta</dt><dd>{form.tipo}</dd><dt>Nombre comercial</dt><dd>{form.comercial}</dd><dt>Responsable</dt><dd>{form.nombre}</dd><dt>Correo</dt><dd>{form.email}</dd></dl></>}
          {step === 0 && <div className="registration__strength"><meter min={0} max={5} value={score} aria-label="Fuerza de contraseña" /><small>{form.password ? ['Muy débil', 'Muy débil', 'Débil', 'Media', 'Buena', 'Fuerte'][score] : 'Fuerza de contraseña'}</small><ul>{passwordRules.map((rule) => <li key={rule.label} style={{ color: rule.test(form.password) ? '#087b61' : '#758096' }}>{rule.test(form.password) ? '✓ ' : '· '}{rule.label}</li>)}</ul></div>}
          {errors.general && <p role="alert" className="registration__error">{errors.general}</p>}
          {!review && <div className="registration__actions">{step > 0 && <button type="button" disabled={saving} onClick={() => { setStep(step - 1); setErrors({}); setReview(false) }}>Atrás</button>}<button className="registration__primary" type="submit" disabled={saving}>{saving ? 'Creando cuenta…' : step < 2 ? 'Continuar' : 'Crear cuenta'}<i className="mdi mdi-arrow-right" aria-hidden="true" /></button></div>}
        </form>{step === 0 && <p className="registration__login">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>}
      </div>
    </section>
  </main>
}
