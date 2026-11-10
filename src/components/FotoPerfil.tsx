import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import axios from 'axios'

import AlertaExito from '@/components/AlertaExito'
import EditorImagen from '@/components/EditorImagen'
import { useAuth } from '@/stores/auth'

const MAX_FOTO_PERFIL = 2 * 1024 * 1024

export default function FotoPerfil({ iniciales }: { iniciales: string }) {
  const selector = useRef<HTMLInputElement>(null)
  const { fotoPerfilUrl, cargandoFotoPerfil, errorFotoPerfil, actualizarFotoPerfil } = useAuth()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [errorSeleccion, setErrorSeleccion] = useState('')
  const [exito, setExito] = useState(false)
  const cerrarExito = useCallback(() => setExito(false), [])

  function seleccionar(event: ChangeEvent<HTMLInputElement>) {
    const imagen = event.target.files?.[0]
    event.target.value = ''
    if (!imagen) return
    if (!['image/jpeg', 'image/png'].includes(imagen.type) || imagen.size > MAX_FOTO_PERFIL || imagen.size === 0) {
      setErrorSeleccion('Elige un JPG o PNG de hasta 2 MB.')
      return
    }
    setErrorSeleccion('')
    setArchivo(imagen)
  }

  async function guardar(recorte: File) {
    try {
      await actualizarFotoPerfil(recorte)
      setArchivo(null)
      setExito(true)
    } catch (error) {
      const mensaje = axios.isAxiosError<{ error?: string }>(error) && error.response?.status === 400
        ? error.response.data.error
        : undefined
      throw new Error(mensaje ?? 'No se pudo guardar la foto. Intenta de nuevo.')
    }
  }

  const accion = fotoPerfilUrl ? 'Cambiar foto' : 'Agregar foto'
  const error = errorSeleccion || (errorFotoPerfil ? 'No se pudo cargar la foto.' : '')

  return (
    <div className="cuenta__foto">
      <div className="cuenta__avatar">
        {fotoPerfilUrl ? <img src={fotoPerfilUrl} alt="Foto de perfil" /> : <span aria-hidden="true">{iniciales || <i className="mdi mdi-account-outline" />}</span>}
        <button type="button" className="cuenta__fotoAccion" aria-label={accion} title={accion}
          onClick={() => selector.current?.click()} disabled={cargandoFotoPerfil}>
          <i className="mdi mdi-plus" aria-hidden="true" />
        </button>
      </div>
      <input ref={selector} type="file" accept="image/png,image/jpeg" onChange={seleccionar} hidden />
      {error && <small className="cuenta__fotoError" role="alert">{error}</small>}
      {archivo && <EditorImagen file={archivo} titulo="Ajustar foto de perfil" descripcion="Vista previa circular de tu foto de perfil"
        nombreArchivo="foto-perfil.jpg" maxBytes={MAX_FOTO_PERFIL} circular textoAplicar="Guardar foto"
        onCancel={() => setArchivo(null)} onApply={guardar} />}
      {exito && <AlertaExito titulo="Foto actualizada" mensaje="Tu foto de perfil se guardó correctamente." accion="Aceptar" onContinuar={cerrarExito} />}
    </div>
  )
}
