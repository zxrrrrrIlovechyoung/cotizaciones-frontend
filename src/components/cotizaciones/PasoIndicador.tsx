import { PASOS } from '@/data/cotizaciones'

export default function PasoIndicador({ paso, maxAlcanzado, onIr }: { paso: number; maxAlcanzado: number; onIr: (paso: number) => void }) {
  return (
    <div className="pasos">
      {PASOS.map((nombre, i) => (
        <span className="pasos__item" key={nombre}>
          <button type="button" className={`paso ${i <= maxAlcanzado ? 'is-accesible' : ''}`} disabled={i > maxAlcanzado} onClick={() => onIr(i)}>
            <span className={`paso__circulo ${i === paso ? 'is-activo' : ''} ${i < paso ? 'is-completado' : ''}`}>{i < paso ? '✓' : i + 1}</span>
            <span className={`paso__nombre ${i === paso ? 'is-activo' : ''} ${i < paso ? 'is-completado' : ''}`}>{nombre}</span>
          </button>
          {i < PASOS.length - 1 && <span className={`linea ${i < paso ? 'is-completada' : ''}`} />}
        </span>
      ))}
    </div>
  )
}
