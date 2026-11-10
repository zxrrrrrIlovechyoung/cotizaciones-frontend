import { reglasContrasena } from '@/data/contrasena'

export default function RequisitosContrasena({ id, contrasena }: { id: string; contrasena: string }) {
  return (
    <ul id={id} className="configuracion__reglasPassword" aria-label="Requisitos de la nueva contraseña">
      {reglasContrasena.map((regla) => {
        const cumplida = regla.test(contrasena)
        return (
          <li key={regla.label} className={cumplida ? 'is-ok' : undefined}>
            <i className={`mdi ${cumplida ? 'mdi-check' : 'mdi-circle-small'}`} aria-hidden="true" />
            {regla.label}{cumplida && <span className="configuracion__reglaEstado"> (cumplido)</span>}
          </li>
        )
      })}
    </ul>
  )
}
