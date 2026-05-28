import { Routes } from '@angular/router';

export const COMPRAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lista-compras/lista-compras').then(m => m.ListaCompras),
  },
];