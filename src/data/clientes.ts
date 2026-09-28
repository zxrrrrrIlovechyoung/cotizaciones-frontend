// Datos estáticos del directorio de clientes. Cuando exista el backend, esto se
// reemplaza por llamadas a la API (services/api.ts) manteniendo los mismos tipos.
// Es la misma fuente que usa el buscador del paso 1 al crear una cotización
// (FormularioCotizacion.tsx), así que un cliente nuevo aquí ya aparece allá.

export interface ClienteRegistrado {
  idCliente: number
  nombreComercial: string
  tipoCliente: string
  rfc: string
  correoContacto: string
  telefonoContacto: string
  atencionA: string
}

export const CLIENTES: ClienteRegistrado[] = [
  {
    idCliente: 101,
    nombreComercial: 'Distribuidora El Roble S.A. de C.V.',
    tipoCliente: 'Empresa',
    rfc: 'DER950101AB1',
    correoContacto: 'compras@elroble.mx',
    telefonoContacto: '773 185 1363',
    atencionA: 'Ing. Marcela Ruiz',
  },
  {
    idCliente: 102,
    nombreComercial: 'Constructora Vega y Asociados',
    tipoCliente: 'Empresa',
    rfc: 'CVA010203XY9',
    correoContacto: 'admin@vega.com.mx',
    telefonoContacto: '771 204 8890',
    atencionA: 'Lic. Hugo Vega',
  },
  {
    idCliente: 103,
    nombreComercial: 'Colegio San Nicolás S.C.',
    tipoCliente: 'Escuela',
    rfc: 'CSN880412K34',
    correoContacto: 'direccion@sannicolas.edu.mx',
    telefonoContacto: '775 112 7745',
    atencionA: 'Mtra. Elena Sáenz',
  },
  {
    idCliente: 104,
    nombreComercial: 'Clínica Santa Elena',
    tipoCliente: 'Empresa',
    rfc: 'CSE030915QQ2',
    correoContacto: 'contacto@santaelena.mx',
    telefonoContacto: '773 900 4412',
    atencionA: 'Dra. Paulina Ortiz',
  },
  {
    idCliente: 105,
    nombreComercial: 'Transportes del Bajío',
    tipoCliente: 'Empresa',
    rfc: 'TBA150720JJ4',
    correoContacto: 'flotilla@transportesbajio.mx',
    telefonoContacto: '461 118 3390',
    atencionA: 'C.P. Julio Navarro',
  },
]

let siguienteId = Math.max(...CLIENTES.map((c) => c.idCliente)) + 1

// Alta en memoria: mientras no exista el backend, un cliente nuevo solo vive
// en esta pestaña. clienteVacio() la usa FormularioCliente.tsx.
export const clienteVacio = (): Omit<ClienteRegistrado, 'idCliente'> => ({
  nombreComercial: '',
  tipoCliente: 'Empresa',
  rfc: '',
  correoContacto: '',
  telefonoContacto: '',
  atencionA: '',
})

export function registrarCliente(datos: Omit<ClienteRegistrado, 'idCliente'>): ClienteRegistrado {
  const cliente: ClienteRegistrado = { idCliente: siguienteId++, ...datos }
  CLIENTES.push(cliente)
  return cliente
}
