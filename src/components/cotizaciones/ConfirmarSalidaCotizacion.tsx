import { useEffect, useId, useRef } from 'react'

export default function ConfirmarSalidaCotizacion({ guardando, onSeguir, onSalir }: {
  guardando: boolean
  onSeguir: () => void
  onSalir: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const seguir = useRef<HTMLButtonElement>(null)
  const title = useId()
  const description = useId()

  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    seguir.current?.focus()
    return () => node?.close()
  }, [])

  return (
    <dialog ref={dialog} className="cotizacion-salida modal__caja" role="alertdialog"
      aria-labelledby={title} aria-describedby={description}
      onCancel={(event) => { event.preventDefault(); onSeguir() }}>
      <div className="modal__icono"><i className="mdi mdi-alert-outline" aria-hidden="true" /></div>
      <h2 id={title} className="modal__titulo">{guardando ? 'Guardando cotización' : 'Cambios sin guardar'}</h2>
      <p id={description} className="modal__texto">
        {guardando ? 'Espera a que termine el guardado para salir.' : 'Si sales, se perderán los cambios de esta cotización.'}
      </p>
      <div className="modal__acciones">
        <button ref={seguir} type="button" className="ui-btn ui-btn--primary" onClick={onSeguir}>Seguir editando</button>
        <button type="button" className="ui-btn modal__borrar" disabled={guardando} onClick={onSalir}>Salir sin guardar</button>
      </div>
    </dialog>
  )
}
