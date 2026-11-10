import { useEffect, useState } from 'react'
import type { Cotizacion } from '@/data/cotizaciones'
import { obtenerPdfCotizacion } from '@/services/cotizaciones'
import { prepararDocumentoGuardado } from '@/services/documentoCotizacion'
import ModalDocumento from './ModalDocumento'

export default function DocumentoGuardado({ cotizacion, nombre, soloConsulta, onClose }: {
  cotizacion: Cotizacion
  nombre: string
  soloConsulta: boolean
  onClose: () => void
}) {
  const [html, setHtml] = useState<string>()
  const [paginas, setPaginas] = useState<string[]>()
  const [aviso, setAviso] = useState('')
  const [intento, setIntento] = useState(0)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const urls: string[] = []
    setCargando(true)
    async function cargarDocumento() {
      try {
        const pdf = await obtenerPdfCotizacion(cotizacion.id, controller.signal)
        if (controller.signal.aborted) return
        if (pdf) {
          const { renderizarPdf } = await import('@/services/renderizarPdf')
          const imagenes = await renderizarPdf(pdf, controller.signal)
          if (!controller.signal.aborted) {
            urls.push(...imagenes.map((imagen) => URL.createObjectURL(imagen)))
            setPaginas(urls)
          }
        } else {
          const documento = await prepararDocumentoGuardado(cotizacion, nombre, controller.signal)
          if (!controller.signal.aborted) setHtml(documento)
        }
        if (!controller.signal.aborted) setAviso('')
      } catch {
        if (!controller.signal.aborted) setAviso('La cotización está guardada. No se pudo abrir el documento.')
      } finally {
        if (!controller.signal.aborted) setCargando(false)
      }
    }
    void cargarDocumento()
    return () => {
      controller.abort()
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [cotizacion, nombre, intento])

  return <ModalDocumento html={html} paginas={paginas} aviso={aviso} imprimir soloConsulta={soloConsulta} onClose={onClose}
    reintentando={cargando} onReintentar={aviso ? () => setIntento((valor) => valor + 1) : undefined} />
}
