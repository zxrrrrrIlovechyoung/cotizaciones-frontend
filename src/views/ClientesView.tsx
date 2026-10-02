import { useState } from 'react'

import AppShell from '@/components/AppShell'
import FormularioCliente from '@/components/clientes/FormularioCliente'
import ListaClientes from '@/components/clientes/ListaClientes'

export default function ClientesView() {
  const [vista, setVista] = useState<'lista' | 'formulario'>('lista')
  const volver = () => setVista('lista')

  return (
    <AppShell>
      {vista === 'formulario' ? <FormularioCliente onVolver={volver} onGuardado={volver} /> : <ListaClientes onNuevo={() => setVista('formulario')} />}
    </AppShell>
  )
}
