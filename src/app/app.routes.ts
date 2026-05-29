import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout';

export const routes: Routes = [
      // Rutas públicas (sin layout)
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },

  // Rutas protegidas (con layout)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./modules/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'modules/inventario', loadChildren: () => import('./modules/inventario/inventario.routes').then(m => m.INVENTARIO_ROUTES) },
      { path: 'modules/compras',    loadChildren: () => import('./modules/compras/compras.routes').then(m => m.COMPRAS_ROUTES) },
      { path: 'modules/reportes',    loadChildren: () => import('./modules/reportes/reportes.routes').then(m => m.REPORTES_ROUTES) },
      { path: 'modules/creditos',    loadChildren: () => import('./modules/creditos/creditos.routes').then(m => m.CREDITOS_ROUTES) },
      { path: 'modules/pedidos',    loadChildren: () => import('./modules/pedidos/pedidos.routes').then(m => m.PEDIDOS_ROUTES) },
      { path: 'modules/ventas',     loadChildren: () => import('./modules/ventas/ventas.routes').then(m => m.VENTAS_ROUTES) },
      { path: 'modules/catalogos',  loadChildren: () => import('./modules/catalogos/catalogos.routes').then(m => m.CATALOGOS_ROUTES) },
      { path: 'modules/usuarios',   loadChildren: () => import('./modules/usuarios/usuarios.routes').then(m => m.USUARIOS_ROUTES) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'dashboard' },
];
