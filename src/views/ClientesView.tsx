import { useState } from 'react'

import AppShell from '@/components/AppShell'
import DetalleCliente from '@/components/clientes/DetalleCliente'
import FormularioCliente from '@/components/clientes/FormularioCliente'
import ListaClientes from '@/components/clientes/ListaClientes'
import type { ClienteRegistrado } from '@/data/clientes'

export default function ClientesView() {
  const [vista, setVista] = useState<'lista' | 'formulario'>('lista')
  const [cliente, setCliente] = useState<ClienteRegistrado | null>(null)
  const volver = () => setVista('lista')

  return (
    <AppShell headerContextual={cliente ? (
      <div className="topbar__contextBlock">
        <button type="button" className="topbar__back" aria-label="Volver a clientes" onClick={() => setCliente(null)}>
          <i className="mdi mdi-arrow-left" aria-hidden="true" />
        </button>
        <div className="ws__titles topbar__tituloListado topbar__tituloCliente">
          <h2 title={cliente.nombreComercial}>{cliente.nombreComercial}</h2>
          <p>Cliente #{cliente.idCliente} · {cliente.tipoCliente || 'Tipo sin especificar'}</p>
        </div>
      </div>
    ) : vista === 'lista' && (
      <div className="ws__titles topbar__tituloListado">
        <h2>Clientes</h2>
        <p>Directorio de clientes registrados en el taller</p>
      </div>
    )}>
      {cliente ? <DetalleCliente key={cliente.idCliente} cliente={cliente} />
        : vista === 'formulario' ? <FormularioCliente onVolver={volver} onGuardado={volver} />
        : <ListaClientes onNuevo={() => setVista('formulario')} onAbrir={setCliente} />}
    </AppShell>
  )
}
