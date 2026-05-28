import { Routes } from '@angular/router';

export const CATALOGOS_ROUTES: Routes = [
  {
    path: 'categorias',
    loadComponent: () => import('./categorias/categorias').then(m => m.Categorias),
  },
  {
    path: 'clientes',
    loadComponent: () => import('./clientes/clientes').then(m => m.Clientes), // Ajusta el nombre de tu clase
  },
  {
    path: 'proveedores',
    loadComponent: () => import('./proveedores/proveedores').then(m => m.Proveedores), // Ajusta el nombre de tu clase
  },
  {
    path: 'unidades-medida',
    loadComponent: () => import('./unidades-medida/unidades-medida').then(m => m.UnidadesMedida), // Ajusta el nombre de tu clase
  },
  {
    path: 'productos',
    loadComponent: () => import('./lista-productos/lista-productos').then(m => m.ListaProductos), // Ajusta el nombre de tu clase
  },
  {
    path: '',
    redirectTo: 'categorias',
    pathMatch: 'full'
  }
];