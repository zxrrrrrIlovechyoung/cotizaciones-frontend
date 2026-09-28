import type { ReactNode } from 'react'

export default function CampoForm({ label, error, ayuda, children }: { label: string; error?: string; ayuda?: string; children: ReactNode }) {
  return (
    <label className="campo">
      <span className="ui-label">{label}</span>
      {children}
      {error ? <span className="campo__error">{error}</span> : ayuda ? <span className="campo__ayuda">{ayuda}</span> : null}
    </label>
  )
}
