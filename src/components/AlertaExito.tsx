import { useEffect, useId, useRef, type ReactNode } from 'react'

export default function AlertaExito({ titulo, mensaje, accion, onContinuar }: {
  titulo: string
  mensaje: ReactNode
  accion: string
  onContinuar: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useId()
  const description = useId()
  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    const timer = window.setTimeout(onContinuar, 3000)
    return () => { window.clearTimeout(timer); node?.close() }
  }, [onContinuar])

  return <dialog ref={dialog} className="cotizacion-exito" aria-labelledby={title} aria-describedby={description}
    onCancel={(event) => { event.preventDefault(); onContinuar() }}>
    <div className="cotizacion-exito__icono"><i className="mdi mdi-check" aria-hidden="true" /></div>
    <h2 id={title}>{titulo}</h2>
    <p id={description}>{mensaje}</p>
    <button type="button" className="ui-btn ui-btn--primary" onClick={onContinuar}>{accion}</button>
  </dialog>
}
