import { useEffect, useId, useRef, useState } from 'react'

const SIZE = 800
const CENTRO = { x: 0, y: 0 }
const limitar = (valor: number, max: number) => Math.max(-max, Math.min(max, valor))

export default function EditorImagen({ file, titulo, descripcion, nombreArchivo, maxBytes, circular, textoAplicar = 'Usar imagen', onCancel, onApply }: {
  file: File
  titulo: string
  descripcion: string
  nombreArchivo: string
  maxBytes: number
  circular?: boolean
  textoAplicar?: string
  onCancel: () => void
  onApply: (file: File) => void | Promise<void>
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ id: number; x: number; y: number; offset: typeof CENTRO } | null>(null)
  const title = useId()
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState(CENTRO)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    const node = dialog.current
    mounted.current = true
    node?.showModal()
    return () => { mounted.current = false; node?.close() }
  }, [])

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const source = new Image()
    source.onload = () => {
      if (source.naturalWidth > 4096 || source.naturalHeight > 4096) {
        setError('La imagen no puede superar 4096 px por lado.')
      } else {
        setImage(source)
      }
    }
    source.onerror = () => setError('No se pudo abrir la imagen.')
    source.src = url
    return () => {
      source.onload = null
      source.onerror = null
      URL.revokeObjectURL(url)
    }
  }, [file])

  const scale = image ? SIZE / Math.min(image.naturalWidth, image.naturalHeight) * zoom : 1
  const width = image ? image.naturalWidth * scale : SIZE
  const height = image ? image.naturalHeight * scale : SIZE
  const clamp = (x: number, y: number) => ({
    x: limitar(x, (width - SIZE) / 2),
    y: limitar(y, (height - SIZE) / 2),
  })
  const position = clamp(offset.x, offset.y)

  // The visible canvas is also the export surface, so the crop cannot diverge.
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx || !image) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, SIZE, SIZE)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, (SIZE - width) / 2 + position.x, (SIZE - height) / 2 + position.y, width, height)
  }, [image, width, height, position.x, position.y])

  function apply() {
    if (!canvas.current || !image || saving) return
    setSaving(true)
    setError('')
    canvas.current.toBlob(async (blob) => {
      if (!mounted.current) return
      try {
        if (!blob || blob.size > maxBytes) throw new Error('No se pudo preparar el recorte.')
        await onApply(new File([blob], nombreArchivo, { type: 'image/jpeg' }))
      } catch (error) {
        if (mounted.current) setError(error instanceof Error ? error.message : 'No se pudo aplicar el recorte.')
      } finally {
        if (mounted.current) setSaving(false)
      }
    }, 'image/jpeg', 0.92)
  }

  return (
    <dialog ref={dialog} className="editor-partida" aria-labelledby={title}
      onCancel={(event) => { event.preventDefault(); if (!saving) onCancel() }}>
      <header className="editor-partida__head">
        <h2 id={title}>{titulo}</h2>
        <button type="button" className="editor-partida__icon" aria-label="Cerrar editor" title="Cerrar editor" disabled={saving} onClick={onCancel}>
          <i className="mdi mdi-close" aria-hidden="true" />
        </button>
      </header>
      <div className="editor-partida__body">
        <div className={`editor-partida__frame${circular ? ' editor-partida__frame--circular' : ''}`}>
          <canvas ref={canvas} width={SIZE} height={SIZE} tabIndex={image ? 0 : -1}
            aria-label={descripcion}
            onPointerDown={(event) => {
              if (!image || saving || !event.isPrimary || event.button !== 0) return
              event.currentTarget.setPointerCapture(event.pointerId)
              drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: position }
            }}
            onPointerMove={(event) => {
              const start = drag.current
              if (!start || start.id !== event.pointerId || saving) return
              const factor = SIZE / event.currentTarget.getBoundingClientRect().width
              setOffset(clamp(start.offset.x + (event.clientX - start.x) * factor, start.offset.y + (event.clientY - start.y) * factor))
            }}
            onLostPointerCapture={() => { drag.current = null }}
            onKeyDown={(event) => {
              const move: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
              const direction = move[event.key]
              if (!direction || !image || saving) return
              event.preventDefault()
              const step = event.shiftKey ? 40 : 10
              setOffset(clamp(position.x + direction[0] * step, position.y + direction[1] * step))
            }}
          />
          {!image && <p role={error ? 'alert' : 'status'}>{error || 'Cargando imagen…'}</p>}
        </div>
        <div className="editor-partida__controls">
          <label><span>Zoom <output>{Math.round(zoom * 100)}%</output></span>
            <input type="range" min="1" max="3" step="0.01" value={zoom} disabled={!image || saving} onChange={(event) => {
              const next = Number(event.target.value)
              setZoom(next)
              setOffset({ x: position.x * next / zoom, y: position.y * next / zoom })
            }} />
          </label>
          <button type="button" className="editor-partida__icon" title="Restablecer encuadre" aria-label="Restablecer encuadre" disabled={!image || saving}
            onClick={() => { setZoom(1); setOffset(CENTRO) }}><i className="mdi mdi-restore" aria-hidden="true" /></button>
        </div>
        {image && error && <p className="campo__error" role="alert">{error}</p>}
      </div>
      <footer className="editor-partida__actions">
        <button type="button" className="ui-btn" disabled={saving} onClick={onCancel}>Cancelar</button>
        <button type="button" className="ui-btn ui-btn--primary" disabled={!image || saving} onClick={apply}>
          <i className="mdi mdi-check" aria-hidden="true" />{saving ? 'Procesando…' : textoAplicar}
        </button>
      </footer>
    </dialog>
  )
}
