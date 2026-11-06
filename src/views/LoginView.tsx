import { useEffect, useState } from 'react'
import '@/styles/login.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/stores/auth'

const REMEMBER_KEY = 'rememberedEmail'
const images = [
  `${import.meta.env.BASE_URL}images/login/finance-0.jpg`,
  `${import.meta.env.BASE_URL}images/login/finance-1.jpg`,
  `${import.meta.env.BASE_URL}images/login/finance-2.jpg`,
  `${import.meta.env.BASE_URL}images/login/finance-3.jpg`,
  `${import.meta.env.BASE_URL}images/login/finance-4.jpg`,
  `${import.meta.env.BASE_URL}images/login/finance-5.jpg`,
]

export default function LoginView() {
  const [activeImage, setActiveImage] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setActiveImage((index) => (index + 1) % images.length), 6500)
    return () => window.clearInterval(timer)
  }, [])
  const auth = useAuth()
  const navigate = useNavigate()
  const rememberedEmail = localStorage.getItem(REMEMBER_KEY) ?? ''
  const [email, setEmail] = useState(rememberedEmail)
  const [password, setPassword] = useState('')
  const [errs, setErrs] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [logoOk, setLogoOk] = useState(true)
  const [remember, setRemember] = useState(Boolean(rememberedEmail))
  const currentYear = new Date().getFullYear()

  function clearError(field: 'email' | 'password') {
    setErrs((current) => ({ ...current, [field]: '' }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrs = {
      email: email.trim() ? '' : 'Correo obligatorio',
      password: password.trim() ? '' : 'Contraseña obligatoria',
    }
    setErrs(nextErrs)
    if (nextErrs.email || nextErrs.password) return

    setLoading(true)
    try {
      await auth.login(email.trim(), password)
      if (remember) localStorage.setItem(REMEMBER_KEY, email.trim())
      else localStorage.removeItem(REMEMBER_KEY)
      navigate('/cotizaciones')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const apiError = err.response?.data?.error as string | undefined
        if (!err.response) setErrs((e) => ({ ...e, password: 'No se pudo conectar con el servidor.' }))
        else if (status === 400 && apiError?.toLowerCase().includes('email')) setErrs((e) => ({ ...e, email: apiError }))
        else if (status === 429) setErrs((e) => ({ ...e, password: 'Demasiados intentos. Por seguridad, espera un momento e inténtalo de nuevo.' }))
        else if (status === 401) setErrs((e) => ({ ...e, password: 'Usuario o contraseña incorrectos.' }))
        else if (status && status >= 500) setErrs((e) => ({ ...e, password: 'Error en el servidor. Contacta al soporte.' }))
        else setErrs((e) => ({ ...e, password: apiError ?? 'Ocurrió un error inesperado.' }))
      } else {
        setErrs((e) => ({ ...e, password: 'Ocurrió un error inesperado.' }))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login login--modern" data-theme="light">
      <section className="login__visual" aria-label="Mercados financieros">
        {images.map((src, index) => <img key={src} src={src} alt="" className={index === activeImage ? 'is-visible' : ''} aria-hidden="true" />)}
        <div className="login__visual-shade" />
        <div className="login__visual-copy"><span>GESTIÓN COMERCIAL</span><h2>Cada oportunidad<br />comienza aquí.</h2><p>Claridad en tus números.<br />Confianza en cada cotización.</p></div>
        <div className="login__slides"><div>{images.map((_, index) => <button key={index} type="button" aria-label={`Ver imagen ${index + 1}`} aria-pressed={index === activeImage} className={index === activeImage ? 'is-active' : ''} onClick={() => setActiveImage(index)} />)}</div></div>
      </section>
      <section className="login__panel">
      <div className="login__main">
        <div className="login__card">
          {logoOk && <div className="login__brand"><img src={`${import.meta.env.BASE_URL}logo.png`} alt="Sistema de Gestión de Cotizaciones" onError={() => setLogoOk(false)} /></div>}
          <span className="login__eyebrow">TU ESPACIO DE TRABAJO</span>
          <h1 className="login__title">Bienvenido de nuevo</h1>
          <p className="login__subtitle">Ingresa a tu cuenta para continuar.</p>
          <form onSubmit={handleSubmit}>
            <div className={`field ${errs.email ? 'field--error' : ''}`}>
              <div className="field__control">
                <input value={email} type="email" placeholder="Usuario o correo electrónico" autoComplete="username" disabled={loading} onChange={(e) => { setEmail(e.target.value); clearError('email') }} />
              </div>
              {errs.email && <span className="field__error">{errs.email}</span>}
            </div>
            <div className={`field ${errs.password ? 'field--error' : ''}`}>
              <div className="field__control">
                <input value={password} type={showPassword ? 'text' : 'password'} placeholder="Contraseña" autoComplete="current-password" disabled={loading} className="field__input--with-action" onChange={(e) => { setPassword(e.target.value); clearError('password') }} />
                <button type="button" className="field__toggle" tabIndex={-1} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((v) => !v)}>
                  <i className={`mdi ${showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'}`} />
                </button>
              </div>
              {errs.password && <span className="field__error">{errs.password}</span>}
            </div>
            <div className="login__options">
              <label className="remember"><input checked={remember} type="checkbox" disabled={loading} onChange={(e) => setRemember(e.target.checked)} /><span>Recordar correo</span></label>
              <button type="button" className="help__link" disabled={loading}>Olvidé mi contraseña</button>
            </div>
            <button type="submit" className="submit" disabled={loading}>{loading ? <span className="spinner" /> : 'Iniciar sesión'}</button>
          </form>
          <div className="divider" />
          <p className="help">¿No tienes cuenta? <button type="button" className="help__link" disabled={loading}>Regístrate</button></p>
        </div>
      </div>
      <footer className="login__footer">© {currentYear} Sistema de Gestión de Cotizaciones</footer>
      </section>
    </div>
  )
}
