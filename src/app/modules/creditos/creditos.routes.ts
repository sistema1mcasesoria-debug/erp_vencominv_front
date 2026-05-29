import { Routes } from '@angular/router';

export const CREDITOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lista-creditos/lista-creditos').then(m => m.ListaCreditos),
  },
];