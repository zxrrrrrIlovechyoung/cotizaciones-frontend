import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import App, { RequireAuth } from './App'
import ConfiguracionLayout from './components/configuracion/ConfiguracionLayout'
import { AuthProvider } from './stores/auth'
import ConfiguracionView from './views/ConfiguracionView'
import DocumentoConfiguracionView from './views/DocumentoConfiguracionView'
import SeguridadView from './views/SeguridadView'

import './styles/variables.css'
import './styles/forms.css'
import './styles/app.css'

const router = createBrowserRouter([
  {
    path: '/configuracion',
    element: <RequireAuth><ConfiguracionLayout /></RequireAuth>,
    children: [
      { index: true, element: <ConfiguracionView /> },
      { path: 'seguridad', element: <SeguridadView /> },
      { path: 'documento', element: <DocumentoConfiguracionView /> },
    ],
  },
  { path: '*', element: <App /> },
])

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
