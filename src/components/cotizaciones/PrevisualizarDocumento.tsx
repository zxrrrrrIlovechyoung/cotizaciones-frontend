import { useEffect, useState } from 'react'
import type { CotizacionForm } from '@/data/cotizaciones'
import { documentoBorrador, imagenDocumento, obtenerEmisor, type EmisorDocumento } from '@/services/documentoCotizacion'
import { CONFIGURACION_DOCUMENTO_PREDETERMINADA, obtenerConfiguracionDocumento } from '@/services/configuracionDocumento'
import ModalDocumento from './ModalDocumento'

const imagenesLeidas = new WeakMap<File, Promise<string>>()

export default function PrevisualizarDocumento({ formulario, nombre, onClose }: {
  formulario: CotizacionForm
  nombre: string
  onClose: () => void
}) {
  const [emisor, setEmisor] = useState<EmisorDocumento>({ comercial: nombre })
  const [imagenes, setImagenes] = useState<string[][]>([])
  const [aviso, setAviso] = useState('')
  const [configuracion, setConfiguracion] = useState(CONFIGURACION_DOCUMENTO_PREDETERMINADA)

  useEffect(() => {
    const controller = new AbortController()
    obtenerEmisor(nombre, controller.signal).then((data) => {
      if (!controller.signal.aborted) setEmisor(data)
    }).catch(() => {
      if (!controller.signal.aborted) setAviso('No se pudo cargar el perfil comercial.')
    })
    obtenerConfiguracionDocumento(controller.signal).then((valor) => {
      if (!controller.signal.aborted) setConfiguracion(valor)
    }).catch(() => {})
    return () => controller.abort()
  }, [nombre])

  useEffect(() => {
    let activo = true
    Promise.all(formulario.partidas.map((p) => Promise.all((p.imagenes ?? []).map((file) => {
      if (!file) return ''
      let lectura = imagenesLeidas.get(file)
      if (!lectura) { lectura = imagenDocumento(file); imagenesLeidas.set(file, lectura) }
      return lectura.catch(() => '')
    })))).then((data) => { if (activo) setImagenes(data) })
    return () => { activo = false }
  }, [formulario.partidas])

  return <ModalDocumento html={documentoBorrador(formulario, emisor, nombre, imagenes, configuracion)} aviso={aviso} onClose={onClose} />
}
