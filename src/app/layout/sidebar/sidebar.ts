import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router'; // <-- Añadido Router
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  roles: string[];
  children?: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class SidebarComponent {
  private authService = inject(AuthService);
  private router = inject(Router); // <-- Inyectamos el Router

  collapsed = signal(false);
  expandedSubmenu = signal<string | null>(null);

  userRol       = computed(() => this.authService.currentUser()?.rol ?? '');
  empresaNombre = computed(() => this.authService.currentUser()?.empresaNombre ?? '');
  usuarioNombre = computed(() => this.authService.currentUser()?.nombreCompleto ?? '');
  avatarLetter  = computed(() => this.usuarioNombre().charAt(0).toUpperCase());

  navItems: NavItem[] = [
    { label: 'Dashboard',   icon: 'grid',          route: '/dashboard',          roles: ['ADMINISTRADOR','CAJERO','ALMACENERO','EMBALADOR'] },
    { label: 'Inventario',  icon: 'package',       route: '/modules/inventario', roles: ['ADMINISTRADOR','ALMACENERO'] },
    { label: 'Compras',     icon: 'shopping-cart', route: '/modules/compras',    roles: ['ADMINISTRADOR','ALMACENERO'] },
    { label: 'Pedidos',     icon: 'clipboard',     route: '/modules/pedidos',    roles: ['ADMINISTRADOR','CAJERO','ALMACENERO','EMBALADOR'] },
    { label: 'Ventas',      icon: 'receipt',       route: '/modules/ventas',     roles: ['ADMINISTRADOR','CAJERO'] },
    { label: 'Clientes',    icon: 'user-cog',     route: '/modules/catalogos/clientes',        roles: ['CAJERO'] },
    { label: 'Kardex',    icon: 'user-cog',     route: '/modules/inventario/kardex',        roles: ['ADMINISTRADOR','CAJERO'] },
    
    // ── Menú Desplegable ──
    { 
      label: 'Catálogos',   
      icon: 'tag',          
      roles: ['ADMINISTRADOR','ALMACENERO'],
      children: [
        { label: 'Categorías',      icon: 'tag',       route: '/modules/catalogos/categorias',      roles: ['ADMINISTRADOR','ALMACENERO'] },
        { label: 'Unidades Medida', icon: 'clipboard', route: '/modules/catalogos/unidades-medida', roles: ['ADMINISTRADOR','ALMACENERO'] },
        { label: 'Clientes',        icon: 'users',     route: '/modules/catalogos/clientes',        roles: ['ADMINISTRADOR','CAJERO'] },
        { label: 'Proveedores',     icon: 'truck',     route: '/modules/catalogos/proveedores',     roles: ['ADMINISTRADOR','ALMACENERO'] },
        { label: 'Productos',     icon: 'truck',     route: '/modules/catalogos/productos',     roles: ['ADMINISTRADOR','ALMACENERO'] },
      ]
    },
    
    { label: 'Usuarios',    icon: 'user-cog',      route: '/modules/usuarios',   roles: ['ADMINISTRADOR'] },
  ];

  visibleItems = computed(() =>
    this.navItems.filter(item => item.roles.includes(this.userRol()))
  );

  getVisibleChildren(children: NavItem[]) {
    return children.filter(child => child.roles.includes(this.userRol()));
  }

  toggleSidebar() { 
    this.collapsed.update(v => !v); 
    if (this.collapsed()) {
      this.expandedSubmenu.set(null);
    }
  }

  // 1. NUEVA LÓGICA: Alterna el menú y navega al primer hijo
  toggleSubmenu(item: NavItem) {
    if (this.collapsed()) {
      this.collapsed.set(false);
    }
    
    if (this.expandedSubmenu() === item.label) {
      // Si ya está abierto, lo cerramos
      this.expandedSubmenu.set(null);
    } else {
      // Si está cerrado, lo abrimos y navegamos a la primera opción automáticamente
      this.expandedSubmenu.set(item.label);
      if (item.children && item.children.length > 0) {
        this.router.navigate([item.children[0].route]);
      }
    }
  }

  // 2. NUEVA FUNCIÓN: Cierra los submenús al hacer clic en un enlace normal
  cerrarSubmenus() {
    this.expandedSubmenu.set(null);
  }

  logout() { 
    this.authService.logout(); 
  }
}