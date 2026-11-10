import { useId, useState, type ComponentProps, type ReactNode } from 'react'

type Props = Omit<ComponentProps<'input'>, 'id' | 'type' | 'children'> & {
  etiqueta: string
  nombreVisibilidad?: string
  children?: ReactNode
}

export default function CampoContrasena({ etiqueta, nombreVisibilidad = etiqueta.toLowerCase(), children, ...input }: Props) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const accion = `${visible ? 'Ocultar' : 'Mostrar'} ${nombreVisibilidad}`

  return (
    <div className="cuenta__field">
      <label className="contrasena__etiqueta" htmlFor={id}>{etiqueta}</label>
      <div className="contrasena__entrada">
        <input {...input} id={id} type={visible ? 'text' : 'password'} className="ui-input" />
        <button type="button" className="contrasena__visibilidad" aria-label={accion} title={accion} aria-controls={id}
          onClick={() => setVisible((anterior) => !anterior)}>
          <i className={`mdi ${visible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'}`} aria-hidden="true" />
        </button>
      </div>
      {children}
    </div>
  )
}
