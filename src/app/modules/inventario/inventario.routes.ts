import { Routes } from '@angular/router';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lotes/lotes').then(m => m.Lotes),
  },
  {
    path: 'kardex', // Ruta específica (/modules/inventario/kardex)
    loadComponent: () =>
      import('./kardex/kardex').then(m => m.Kardex),
  }
];