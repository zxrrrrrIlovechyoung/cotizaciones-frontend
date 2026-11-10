import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

export async function renderizarPdf(pdf: Blob, signal: AbortSignal) {
  const data = await pdf.arrayBuffer()
  signal.throwIfAborted()
  const tarea = getDocument({ data, useWasm: false })
  const destruir = () => { void tarea.destroy().catch(() => {}) }
  signal.addEventListener('abort', destruir, { once: true })
  const paginas: Blob[] = []
  const canvas = document.createElement('canvas')
  try {
    const documento = await tarea.promise
    for (let numero = 1; numero <= documento.numPages; numero++) {
      signal.throwIfAborted()
      const pagina = await documento.getPage(numero)
      const viewport = pagina.getViewport({ scale: 2.5 })
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      await pagina.render({ canvas, viewport }).promise
      paginas.push(await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((imagen) => imagen ? resolve(imagen) : reject(new Error('No se pudo preparar la página.')))
      }))
      pagina.cleanup()
    }
    return paginas
  } finally {
    signal.removeEventListener('abort', destruir)
    if (!signal.aborted) await tarea.destroy()
    canvas.width = canvas.height = 0
  }
}
