import { Routes } from '@angular/router';

export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lista-ventas/lista-ventas').then(m => m.ListaVentas),
  },
];