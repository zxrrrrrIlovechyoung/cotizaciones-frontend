import { useEffect, useId, useRef, useState } from 'react'

import HojaDocumento from './HojaDocumento'

export default function ModalDocumento({ html, paginas, aviso, imprimir = false, soloConsulta = false, reintentando, onReintentar, onClose }: {
  html?: string
  paginas?: string[]
  aviso?: string
  imprimir?: boolean
  soloConsulta?: boolean
  reintentando?: boolean
  onReintentar?: () => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const title = useId()
  const [listo, setListo] = useState(false)
  const puedeImprimir = imprimir && !soloConsulta

  useEffect(() => {
    const node = dialog.current
    node?.showModal()
    return () => node?.close()
  }, [])

  return <dialog ref={dialog} className="documento-preview" aria-labelledby={title} onCancel={(event) => {
    event.preventDefault()
    onClose()
  }}>
    <div className="documento-preview__head">
      <h2 id={title}>Previsualizar documento</h2>
      <button type="button" className="icon-btn" title="Cerrar previsualización" aria-label="Cerrar previsualización" onClick={onClose}>
        <i className="mdi mdi-close" aria-hidden="true" />
      </button>
    </div>
    {aviso && <p role="status" className="form__error">{aviso}</p>}
    <div className="documento-preview__area">
      {html || paginas ? <HojaDocumento html={html} paginas={paginas} titulo={imprimir ? 'Cotización guardada' : 'Borrador de cotización'}
        frame={frame} imprimir={puedeImprimir} onLoad={() => setListo(true)} />
        : !aviso && <p role="status">Preparando documento…</p>}
    </div>
    {(puedeImprimir || onReintentar) && <footer className="documento-preview__actions">
      {onReintentar ? <button type="button" className="ui-btn ui-btn--primary" disabled={reintentando} onClick={onReintentar}>
        {reintentando ? <><span className="spinner" aria-hidden="true" /> Preparando…</> : 'Reintentar'}
      </button> : (html || paginas) && <button type="button" className="ui-btn ui-btn--primary" disabled={!listo} onClick={() => frame.current?.contentWindow?.print()}>
        <i className="mdi mdi-printer" aria-hidden="true" /> Imprimir
      </button>}
    </footer>}
  </dialog>
}
