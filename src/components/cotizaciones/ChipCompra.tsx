import { CHIP_ESTADO_COMPRA, type EstadoCompra } from '@/data/cotizaciones'

export default function ChipCompra({ requiereCompra, estadoCompra }: { requiereCompra: boolean; estadoCompra: EstadoCompra }) {
  if (!requiereCompra) return <span className="chip chip--neutro">Sin compra</span>
  if (!estadoCompra) return <span className="chip chip--pendiente">Por definir</span>
  const estilo = CHIP_ESTADO_COMPRA[estadoCompra]
  return <span className="chip" style={{ background: estilo.bg, color: estilo.color }}>{estilo.label}</span>
}
