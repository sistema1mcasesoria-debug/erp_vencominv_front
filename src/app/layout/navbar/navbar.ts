import { Component, signal, inject, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';

interface Breadcrumb {
  label: string;
  route?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  dashboard:   'Dashboard',
  modules:     'Módulos',
  inventario:  'Inventario',
  compras:     'Compras',
  pedidos:     'Pedidos',
  ventas:      'Ventas',
  catalogos:   'Catálogos',
  clientes:    'Clientes',
  proveedores: 'Proveedores',
  usuarios:    'Usuarios',
  nuevo:       'Nuevo',
  editar:      'Editar',
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router      = inject(Router);

  notificationsOpen = signal(false);
  profileOpen       = signal(false);

  usuarioNombre = computed(() => this.authService.currentUser()?.nombreCompleto ?? '');
  userRol       = computed(() => this.authService.currentUser()?.rol ?? '');
  empresaNombre = computed(() => this.authService.currentUser()?.empresaNombre ?? '');
  avatarLetter  = computed(() => this.usuarioNombre().charAt(0).toUpperCase());

  breadcrumbs = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => this.buildBreadcrumbs((e as NavigationEnd).urlAfterRedirects))
    ),
    { initialValue: this.buildBreadcrumbs(this.router.url) }
  );

  private buildBreadcrumbs(url: string): Breadcrumb[] {
    const segments = url.split('/').filter(Boolean);
    const crumbs: Breadcrumb[] = [{ label: 'Inicio', route: '/dashboard' }];
    let path = '';
    for (const seg of segments) {
      path += `/${seg}`;
      crumbs.push({ label: ROUTE_LABELS[seg] ?? seg, route: path });
    }
    return crumbs;
  }

  toggleNotifications() {
    this.notificationsOpen.update(v => !v);
    this.profileOpen.set(false);
  }

  toggleProfile() {
    this.profileOpen.update(v => !v);
    this.notificationsOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const t = e.target as HTMLElement;
    if (!t.closest('.nav-notifications') && !t.closest('.nav-profile')) {
      this.notificationsOpen.set(false);
      this.profileOpen.set(false);
    }
  }

  logout() { this.authService.logout(); }
}