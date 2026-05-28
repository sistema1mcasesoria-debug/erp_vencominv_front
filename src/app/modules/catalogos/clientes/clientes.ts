// src/app/features/clientes/clientes.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { ClienteRequest, ClienteResponse } from '../../../core/models/cliente.model';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html'
})
export class Clientes implements OnInit {
  private clienteService = inject(ClienteService);

  // Estados de la lista
  clientes = signal<ClienteResponse[]>([]);
  loading = signal(false);
  errorGlobal = signal('');
  busqueda = signal('');

  // Filtro de búsqueda rápida
  clientesFiltrados = computed(() => {
    const term = this.busqueda().toLowerCase().trim();
    if (!term) return this.clientes();
    return this.clientes().filter(c => 
      c.nombreCompleto.toLowerCase().includes(term) || 
      c.documentoIdentidad.includes(term)
    );
  });

  // Estados del Modal
  modalAbierto = signal(false);
  modoEdicion = signal(false);
  submitting = signal(false);
  clienteSeleccionadoId = signal<number | null>(null);

  // Formulario
  formCliente = signal<ClienteRequest>({
    nombreCompleto: '',
    documentoIdentidad: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.loading.set(true);
    this.errorGlobal.set('');
    
    this.clienteService.obtenerClientes().subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorGlobal.set('No se pudo cargar el directorio de clientes.');
        this.loading.set(false);
      }
    });
  }

  // --- CONTROL DEL MODAL ---
  abrirModalNuevo() {
    this.modoEdicion.set(false);
    this.clienteSeleccionadoId.set(null);
    this.resetearFormulario();
    this.modalAbierto.set(true);
  }

  abrirModalEditar(cliente: ClienteResponse) {
    this.modoEdicion.set(true);
    this.clienteSeleccionadoId.set(cliente.id);
    this.formCliente.set({
      nombreCompleto: cliente.nombreCompleto,
      documentoIdentidad: cliente.documentoIdentidad,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || ''
    });
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.resetearFormulario();
  }

  resetearFormulario() {
    this.formCliente.set({ nombreCompleto: '', documentoIdentidad: '', telefono: '', email: '', direccion: '' });
    this.errorGlobal.set('');
  }

  // --- GUARDAR O ACTUALIZAR ---
  guardarCliente() {
    const payload = this.formCliente();
    
    if (!payload.nombreCompleto || !payload.documentoIdentidad) {
      this.errorGlobal.set('El nombre y el documento de identidad son obligatorios.');
      return;
    }

    this.submitting.set(true);

    if (this.modoEdicion() && this.clienteSeleccionadoId()) {
      // Editar
      this.clienteService.actualizarCliente(this.clienteSeleccionadoId()!, payload).subscribe({
        next: () => this.finalizarGuardado(),
        error: () => this.manejarError('Error al actualizar el cliente.')
      });
    } else {
      // Crear
      this.clienteService.crearCliente(payload).subscribe({
        next: () => this.finalizarGuardado(),
        error: () => this.manejarError('Error al registrar el nuevo cliente.')
      });
    }
  }

  private finalizarGuardado() {
    this.submitting.set(false);
    this.cerrarModal();
    this.cargarClientes();
  }

  private manejarError(mensaje: string) {
    this.errorGlobal.set(mensaje);
    this.submitting.set(false);
  }
}