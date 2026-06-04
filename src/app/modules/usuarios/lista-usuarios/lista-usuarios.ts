// src/app/features/usuarios/lista-usuarios/lista-usuarios.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core'; // <-- Se agregó 'computed'
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- NECESARIO PARA EL INPUT
import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario, UsuarioRequest } from '../../../core/models/usuario.model';
import { Rol } from '../../../core/models/rol.model';
import { FormUsuarios } from '../form-usuarios/form-usuarios';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, FormUsuarios], // <-- Agregamos FormsModule aquí
  templateUrl: './lista-usuarios.html',
})
export class ListaUsuarios implements OnInit {
  private usuarioService = inject(UsuarioService);

  usuarios = signal<Usuario[]>([]);
  roles = signal<Rol[]>([]);
  loading = signal(false);
  errorGlobal = signal('');

  // --- NUEVO: ESTADOS PARA EL FILTRO ---
  busqueda = signal('');
  
  // Computamos la lista filtrada automáticamente cuando 'busqueda' o 'usuarios' cambien
  usuariosFiltrados = computed(() => {
    const termino = this.busqueda().toLowerCase().trim();
    if (!termino) return this.usuarios();
    
    return this.usuarios().filter(u => 
      u.nombreCompleto.toLowerCase().includes(termino) ||
      u.username.toLowerCase().includes(termino)
    );
  });

  // Estados para controlar el comportamiento del formulario hijo
  modalAbierto = signal(false);
  usuarioSeleccionado = signal<Usuario | null>(null);

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    this.loading.set(true);
    this.errorGlobal.set('');
    
    this.usuarioService.obtenerRoles().subscribe({
      next: (rolesData) => {
        this.roles.set(rolesData);
        this.obtenerListaUsuarios();
      },
      error: () => {
        this.errorGlobal.set('Error al cargar la configuración de roles del sistema.');
        this.loading.set(false);
      }
    });
  }

  obtenerListaUsuarios() {
    this.usuarioService.obtenerUsuarios().subscribe({
      next: (usuariosData) => {
        this.usuarios.set(usuariosData);
        this.loading.set(false);
      },
      error: () => {
        this.errorGlobal.set('No tienes permisos o expiró tu sesión para ver la lista de usuarios.');
        this.loading.set(false);
      }
    });
  }

  abrirModalCrear() {
    this.usuarioSeleccionado.set(null); 
    this.modalAbierto.set(true);
  }

  abrirModalEditar(usuario: Usuario) {
    this.usuarioSeleccionado.set(usuario); 
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.usuarioSeleccionado.set(null);
  }

  manejarGuardadoExitoso() {
    this.cerrarModal();
    this.obtenerListaUsuarios(); 
  }

  cambiarEstado(usuario: Usuario) {
    if (usuario.estado) {
      this.usuarioService.desactivarUsuario(usuario.id).subscribe({
        next: () => this.obtenerListaUsuarios(),
        error: () => this.errorGlobal.set('Error interno al intentar suspender el usuario.')
      });
    } else {
      const payload: UsuarioRequest = {
        username: usuario.username,
        nombreCompleto: usuario.nombreCompleto,
        rolId: usuario.rolId
      };
      this.usuarioService.actualizarUsuario(usuario.id, payload).subscribe({
        next: () => this.obtenerListaUsuarios(),
        error: () => this.errorGlobal.set('Error interno al intentar activar el usuario.')
      });
    }
  }

  getNombreRol(rolId: number): string {
    const rol = this.roles().find(r => r.id === rolId);
    return rol ? rol.nombre : 'OPERATIVO';
  }
}