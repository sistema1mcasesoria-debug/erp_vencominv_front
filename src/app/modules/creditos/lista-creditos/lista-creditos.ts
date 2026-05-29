import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <-- Asegúrate de importar FormsModule
import { CreditosService } from '../../../core/services/creditos.service';

@Component({
  selector: 'app-lista-creditos',
  standalone: true,
  imports: [CommonModule, FormsModule], // <-- Agrégalo aquí
  templateUrl: './lista-creditos.html'
})
export class ListaCreditos implements OnInit {
  private creditosService = inject(CreditosService);

  deudas = signal<any[]>([]);
  loading = signal<boolean>(true);
  errorGlobal = signal<string | null>(null);

  // --- VARIABLES PARA EL MODAL DE PAGO ---
  modalPagoAbierto = signal<boolean>(false);
  ventaCobrar = signal<any | null>(null);
  procesandoPago = signal<boolean>(false);
  
  formAbono = signal({
    monto: 0,
    metodoPago: 'EFECTIVO',
    referencia: ''
  });

  ngOnInit() {
    this.cargarDeudas();
  }

  cargarDeudas() {
    this.loading.set(true);
    this.creditosService.obtenerDeudasPendientes().subscribe({
      next: (data) => {
        this.deudas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorGlobal.set('Error al cargar las cuentas por cobrar.');
        this.loading.set(false);
      }
    });
  }

  totalPorCobrar() {
    return this.deudas().reduce((acc, curr) => acc + curr.saldoPendiente, 0);
  }

  // --- LÓGICA DEL MODAL DE PAGO ---
  abrirModalPago(venta: any) {
    this.ventaCobrar.set(venta);
    // Por defecto, sugerimos cobrar todo el saldo pendiente
    this.formAbono.set({
      monto: venta.saldoPendiente,
      metodoPago: 'EFECTIVO',
      referencia: ''
    });
    this.modalPagoAbierto.set(true);
    this.errorGlobal.set(null);
  }

  cerrarModalPago() {
    this.modalPagoAbierto.set(false);
    this.ventaCobrar.set(null);
  }

  registrarPago() {
    const venta = this.ventaCobrar();
    const abono = this.formAbono();

    if (abono.monto <= 0 || abono.monto > venta.saldoPendiente) {
      this.errorGlobal.set('El monto ingresado no es válido. Verifique el saldo pendiente.');
      return;
    }

    this.procesandoPago.set(true);

    const payload = {
      ventaId: venta.id,
      monto: abono.monto,
      metodoPago: abono.metodoPago,
      referencia: abono.referencia
    };

    this.creditosService.registrarAbono(payload).subscribe({
      next: () => {
        this.procesandoPago.set(false);
        this.cerrarModalPago();
        this.cargarDeudas(); // Refrescamos la tabla para que desaparezca o actualice su saldo
      },
      error: (err) => {
        this.errorGlobal.set(err.error?.message || 'Ocurrió un error al registrar el pago.');
        this.procesandoPago.set(false);
      }
    });
  }
}