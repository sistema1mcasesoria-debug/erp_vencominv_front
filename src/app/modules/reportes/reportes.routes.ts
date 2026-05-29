import { Routes } from '@angular/router';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./centro-reportes/centro-reportes').then(m => m.CentroReportes),
  },
];