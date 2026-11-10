import { useLayoutEffect, useRef, useState, type Ref } from 'react'

// La vista previa conserva las dimensiones y los márgenes de una hoja carta.
const anchoCarta = 8.5 * 96
const altoCarta = 11 * 96
const separacionPaginas = 12
const estiloHoja = '<style>@media screen {main {width:8.5in;max-width:none;min-height:11in;padding:14mm 14mm 70mm}}</style>'

export default function HojaDocumento({ html, paginas, titulo, imprimir = false, frame, onLoad }: {
  html?: string
  paginas?: string[]
  titulo: string
  imprimir?: boolean
  frame?: Ref<HTMLIFrameElement>
  onLoad?: () => void
}) {
  const area = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(1)
  const totalPaginas = paginas?.length ?? 1
  const alto = altoCarta * totalPaginas + separacionPaginas * (totalPaginas - 1)
  const contenido = paginas ? `<!doctype html><html lang="es"><head><meta charset="utf-8">
    <title>Cotización guardada</title><style>
    @page { size: letter; margin: 0; }
    body { margin: 0; }
    img { display: block; width: 8.5in; height: 11in; break-inside: avoid; }
    img + img { break-before: page; }
    @media screen { body { background: #e8edf3; } img + img { margin-top: ${separacionPaginas}px; } }
    @media print { img { height: calc(11in - 1px); } }
    </style></head><body>${paginas.map((url, i) => `<img src="${url}" alt="Página ${i + 1} de la cotización">`).join('')}</body></html>`
    : html?.replace('</head>', `${estiloHoja}</head>`)

  useLayoutEffect(() => {
    const node = area.current
    if (!node) return
    const ajustar = (ancho: number) => {
      if (ancho > 0) setEscala(Math.min(1, ancho / anchoCarta))
    }
    ajustar(node.clientWidth)
    const observer = new ResizeObserver(([entry]) => ajustar(entry.contentRect.width))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={area}>
      <div className="documento-preview__hoja" style={{ width: anchoCarta * escala, height: alto * escala }}>
        <iframe ref={frame} title={titulo} width={anchoCarta} height={alto} style={{ transform: `scale(${escala})` }}
          sandbox={imprimir ? 'allow-same-origin allow-modals' : paginas ? 'allow-same-origin' : ''} srcDoc={contenido} onLoad={onLoad} />
      </div>
    </div>
  )
}
