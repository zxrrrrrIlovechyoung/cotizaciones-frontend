import { useEffect, useRef, useState } from 'react'
import { MAX_IMAGEN_PARTIDA, obtenerImagenPartida } from '@/services/cotizaciones'
import EditorImagen from '@/components/EditorImagen'

export function SelectorImagenPartida({ file, slot, onChange, disabled }: {
  file: File | null
  slot: number
  onChange: (file: File | null) => void
  disabled: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<File | null>(null)
  const [original, setOriginal] = useState<{ source: File; result: File } | null>(null)
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return (
    <div className="partida-adjunto">
      <input ref={input} type="file" accept="image/jpeg,image/png" hidden disabled={disabled} onChange={(event) => {
        const next = event.currentTarget.files?.[0]
        event.currentTarget.value = ''
        if (!next) return
        if (!['image/jpeg', 'image/png'].includes(next.type) || next.size < 1 || next.size > MAX_IMAGEN_PARTIDA) {
          setError('Selecciona un JPG o PNG de hasta 2 MB.')
          return
        }
        setError('')
        setEditing(next)
      }} />
      <button type="button" className="partida-adjunto__preview" disabled={disabled}
        onClick={() => file ? setEditing(original?.result === file ? original.source : file) : input.current?.click()}
        aria-label={`${file ? 'Editar' : 'Agregar'} imagen ${slot}`} title={`${file ? 'Editar' : 'Agregar'} imagen ${slot}`}>
        {preview ? <img src={preview} alt={`Vista previa ${slot}`} /> : <><i className="mdi mdi-image-plus" aria-hidden="true" /><span>Imagen {slot}</span></>}
      </button>
      {file && <>
        <button type="button" className="partida-adjunto__quitar partida-adjunto__cambiar" disabled={disabled} title={`Cambiar archivo ${slot}`} aria-label={`Cambiar archivo ${slot}`} onClick={() => input.current?.click()}><i className="mdi mdi-image-plus" aria-hidden="true" /></button>
        <button type="button" className="partida-adjunto__quitar" disabled={disabled} title={`Quitar imagen ${slot}`} aria-label={`Quitar imagen ${slot}`} onClick={() => { setError(''); setOriginal(null); onChange(null) }}><i className="mdi mdi-close" aria-hidden="true" /></button>
      </>}
      {error && <small className="campo__error" role="alert">{error}</small>}
      {editing && <EditorImagen file={editing} titulo={`Ajustar imagen ${slot}`} descripcion="Vista previa del encuadre para el documento"
        nombreArchivo={`partida-imagen-${slot}.jpg`} maxBytes={MAX_IMAGEN_PARTIDA} onCancel={() => setEditing(null)} onApply={(result) => {
        setOriginal({ source: editing, result })
        onChange(result)
        setEditing(null)
      }} />}
    </div>
  )
}

export function ImagenPartidaGuardada({ id, slot, disponible }: { id: number; slot: number; disponible?: boolean }) {
  const [src, setSrc] = useState('')
  const [error, setError] = useState(false)
  useEffect(() => {
    setSrc('')
    setError(false)
    if (!disponible) return
    const controller = new AbortController()
    let url = ''
    obtenerImagenPartida(id, slot, controller.signal).then((blob) => {
      if (controller.signal.aborted) return
      url = URL.createObjectURL(blob)
      setSrc(url)
    }).catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, slot, disponible])
  return src ? <img className="partida-imagen" src={src} alt={`Imagen ${slot} de la partida`} /> :
    <span><i className="mdi mdi-image-outline" aria-hidden="true" /><small>{error ? 'No disponible' : disponible ? 'Cargando…' : 'Sin imagen'}</small></span>
}
