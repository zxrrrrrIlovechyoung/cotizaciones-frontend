const trazos = {
  seguridad: 'M12 22s7-3 7-10V5l-7-3-7 3v7c0 7 7 10 7 10Z M9 12l2 2 4-4',
  documento: 'M13 3H5v18h7 M13 3v5h5 M13 3l5 5v3 M8 11h5 M8 15h2 M14 21l1-4 5-5 3 3-5 5-4 1Z',
  preferencias: 'M4 6h16 M4 12h16 M4 18h16 M8 4v4 M16 10v4 M10 16v4',
  alertas: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  flecha: 'm6 9 6 6 6-6',
  siguiente: 'm9 6 6 6-6 6',
  volver: 'M20 12H4m7 7-7-7 7-7',
  candado: 'M7 11V7a5 5 0 0 1 10 0v4 M5 11h14v10H5z M12 15v2',
  recuperar: 'M15 7a4 4 0 1 0 4 4 4 4 0 0 0-4-4Z M12 14l-6 6H3v-3l6-6 M15 11h.01',
  eliminar: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 10v7 M14 10v7',
  salir: 'M11 4H5v16h6 M10 12h11 M17 8l4 4-4 4',
}

export default function IconoConfiguracion({ icono, className = '' }: { icono: keyof typeof trazos; className?: string }) {
  return (
    <svg className={`configuracion__icono ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={trazos[icono]} />
    </svg>
  )
}
