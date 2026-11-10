import { useLocation, useNavigate } from 'react-router-dom'

import RecuperarContrasena from '@/components/configuracion/RecuperarContrasena'
import '@/styles/registro.css'

export default function RecuperacionView() {
  const location = useLocation()
  const navigate = useNavigate()
  const correo = location.state?.correo
  const volverAlLogin = () => navigate('/login', { replace: true })

  return (
    <main className="registration" data-theme="light">
      <div className="registration__panel">
        <div className="registration__body recuperacion__pagina">
          <RecuperarContrasena enPagina correoInicial={typeof correo === 'string' ? correo : undefined}
            onCerrar={volverAlLogin} onFinalizar={volverAlLogin} />
        </div>
      </div>
    </main>
  )
}
