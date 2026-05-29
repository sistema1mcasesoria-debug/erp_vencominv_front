import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Agregado para usar ngModel
import { CompraService } from '../../../core/services/compra.service';
import { CompraResponse } from '../../../core/models/compra.model';
import { NuevaCompra } from '../nueva-compra/nueva-compra';

@Component({
  selector: 'app-lista-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, NuevaCompra],
  templateUrl: './lista-compras.html',
})
export class ListaCompras implements OnInit {
  private compraService = inject(CompraService);

  compras = signal<CompraResponse[]>([]);
  loading = signal(false);
  errorGlobal = signal('');
  modalAbierto = signal(false);

  // --- Variables para el Modal de Pago ---
  modalPagoAbierto = signal(false);
  compraAPagar = signal<CompraResponse | null>(null);
  procesandoPago = signal(false);

  formAbono = signal({
    monto: 0,
    metodoPago: 'EFECTIVO',
    referencia: ''
  });

  ngOnInit() {
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.loading.set(true);
    this.errorGlobal.set('');

    this.compraService.obtenerCompras().subscribe({
      next: (data) => {
        this.compras.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorGlobal.set('No se pudo cargar el historial de compras.');
        this.loading.set(false);
      }
    });
  }

  abrirNuevaCompra() {
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  refrescarTabla() {
    this.cerrarModal();
    this.cargarHistorial();
  }

  // --- Funciones para el Modal de Pago ---
  abrirModalPago(compra: CompraResponse) {
    this.compraAPagar.set(compra);
    this.formAbono.set({
      monto: compra.saldoPendiente,
      metodoPago: 'TRANSFERENCIA', // Por defecto para proveedores
      referencia: ''
    });
    this.modalPagoAbierto.set(true);
    this.errorGlobal.set('');
  }

  cerrarModalPago() {
    this.modalPagoAbierto.set(false);
    this.compraAPagar.set(null);
  }

  registrarPago() {
    const compra = this.compraAPagar();
    const abono = this.formAbono();

    if (!compra) return;

    if (abono.monto <= 0 || abono.monto > compra.saldoPendiente) {
      this.errorGlobal.set('El monto a pagar no es válido.');
      return;
    }

    this.procesandoPago.set(true);

    const payload = {
      compraId: compra.id,
      monto: abono.monto,
      metodoPago: abono.metodoPago,
      referencia: abono.referencia
    };

    this.compraService.registrarPagoProveedor(payload).subscribe({
      next: () => {
        this.procesandoPago.set(false);
        this.cerrarModalPago();
        this.cargarHistorial(); // Refrescar para ver el nuevo saldo y estado
      },
      error: (err) => {
        this.procesandoPago.set(false);
        this.errorGlobal.set(err.error?.message || 'Error al registrar el pago al proveedor.');
      }
    });
  }
}