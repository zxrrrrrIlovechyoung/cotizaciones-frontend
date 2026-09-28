import { useState } from 'react'

import AppTopBar from '@/components/AppTopBar'
import FormularioCliente from '@/components/clientes/FormularioCliente'
import ListaClientes from '@/components/clientes/ListaClientes'

export default function ClientesView() {
  const [vista, setVista] = useState<'lista' | 'formulario'>('lista')
  const volver = () => setVista('lista')

  return (
    <div className="page">
      <AppTopBar />
      <main className="page__main">
        {vista === 'formulario' ? <FormularioCliente onVolver={volver} onGuardado={volver} /> : <ListaClientes onNuevo={() => setVista('formulario')} />}
      </main>
    </div>
  )
}
