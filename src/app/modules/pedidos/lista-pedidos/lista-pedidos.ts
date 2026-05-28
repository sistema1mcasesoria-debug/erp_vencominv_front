// src/app/features/pedidos/lista-pedidos/lista-pedidos.ts
import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../../core/services/pedido.service';
import { PedidoResponse } from '../../../core/models/pedido.model';
import { NuevoPedido } from '../nuevo-pedido/nuevo-pedido';

@Component({
  selector: 'app-lista-pedidos',
  standalone: true,
  imports: [CommonModule, NuevoPedido],
  templateUrl: './lista-pedidos.html',
})
export class ListaPedidos implements OnInit {
  private pedidoService = inject(PedidoService);

  pedidos = signal<PedidoResponse[]>([]);
  loading = signal(false);
  
  modalAbierto = signal(false);
  pedidoDetalleSeleccionado = signal<PedidoResponse | null>(null);
  
  // 🔥 NUEVO: Calcula el total sumando los subtotales de la lista
  totalPedidoSeleccionado = computed(() => {
    const pedido = this.pedidoDetalleSeleccionado();
    if (!pedido || !pedido.detalle) return 0;
    
    return pedido.detalle.reduce((acc, det) => acc + det.subtotal, 0);
  });
  // Seguridad y Roles
  rolUsuario = signal<string>('');

  ngOnInit() {
    this.extraerRolDelToken();
    this.cargarPedidos();
  }

  extraerRolDelToken() {
    try {
      const token = localStorage.getItem('erp_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Mapea a mayúsculas para comparar fácil (ej: "ADMINISTRADOR")
        this.rolUsuario.set((payload.rol || payload.role || '').toUpperCase()); 
      }
    } catch (e) {
      console.error('Error al decodificar el rol del usuario', e);
    }
  }

  cargarPedidos() {
    this.loading.set(true);
    this.pedidoService.obtenerPedidos().subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.loading.set(false);
        console.log(this.pedidos)
      },
      error: () => this.loading.set(false)
    });
  }

 cambiarEstado(id: number, nuevoEstado: string) {
    this.pedidoService.actualizarEstado(id, nuevoEstado).subscribe({
      next: () => this.cargarPedidos(),
      error: (err) => {
        console.error('Error al actualizar', err);
        // 🔥 Esto extraerá el texto del error que viene desde Java
        const mensajeBackend = err.error?.message || err.message || 'Error desconocido';
        alert(`Error al cambiar a ${nuevoEstado}:\n\n${mensajeBackend}\n\nRevisa la consola de Spring Boot para más detalles.`);
      }
    });
  }
  
  // --- LÓGICA DE PERMISOS ---
  puedeCrearPedido(): boolean {
    const rol = this.rolUsuario();
    return rol === 'ADMINISTRADOR' || rol === 'CAJERO';
  }

  puedeCambiarEstadoFlujo(estadoActual: string): boolean {
    const rol = this.rolUsuario();
    if (rol === 'ADMINISTRADOR') return true;
    
    // Solo Almacenero y Embalador pueden mover la caja
    if (rol === 'ALMACENERO' || rol === 'EMBALADOR') {
       return estadoActual !== 'ENTREGADO' && estadoActual !== 'CANCELADO';
    }
    return false;
  }

  puedeCancelar(estadoActual: string): boolean {
    const rol = this.rolUsuario();
    if (rol === 'ADMINISTRADOR') return true;

    // Cajero solo cancela si aún está en almacén preparándose
    if (rol === 'CAJERO') {
      return estadoActual === 'PENDIENTE' || estadoActual === 'EMPAQUETANDO';
    }
    return false;
  }

  // --- LÓGICA DE DETALLES (OJITO) ---
  verDetalle(pedido: PedidoResponse) {
    this.pedidoDetalleSeleccionado.set(pedido);
  }

  cerrarDetalle() {
    this.pedidoDetalleSeleccionado.set(null);
  }

  // Define los colores
  getColorEstado(estado: string) {
    const colores: any = {
      'PENDIENTE': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'EMPAQUETANDO': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'LISTO': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'ENTREGADO': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'CANCELADO': 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    return colores[estado] || 'bg-gray-500/10 text-gray-400';
  }
}