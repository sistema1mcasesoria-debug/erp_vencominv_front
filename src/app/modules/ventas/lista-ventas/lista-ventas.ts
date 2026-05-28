import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VentaService } from '../../../core/services/venta.service';
import { VentaResponse } from '../../../core/models/venta.model';
import { NuevaVenta } from '../nueva-venta/nueva-venta'; 
import { VentaTicket } from '../venta-ticket/venta-ticket'; 
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-lista-ventas',
  standalone: true,
  imports: [CommonModule, NuevaVenta, VentaTicket], 
  templateUrl: './lista-ventas.html',
})
export class ListaVentas implements OnInit {
  private ventaService = inject(VentaService);
  private http = inject(HttpClient);
  ventas = signal<VentaResponse[]>([]);
  loading = signal(false);
  errorGlobal = signal('');

  // Control del modal POS (Nueva Venta)
  modalAbierto = signal(false);

  // Control del modal de Previsualización (Ticket)
  ticketSeleccionado = signal<VentaResponse | null>(null);
  modalTicketAbierto = signal(false);

  ngOnInit() {
    this.cargarHistorial();
  }
  exportarExcel() {
    this.http.get('http://localhost:8080/api/v1/reportes/ventas/excel', {
      responseType: 'blob' 
    }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'registro_ventas.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error al descargar:', err);
        this.errorGlobal.set('No se pudo generar el reporte de Excel.');
      }
    });
  }
  cargarHistorial(autoAbrirUltimoTicket: boolean = false) {
    this.loading.set(true);
    this.errorGlobal.set('');

    this.ventaService.obtenerVentas().subscribe({
      next: (data) => {
        this.ventas.set(data);
        this.loading.set(false);

        // 🔥 ¡LA MAGIA AQUÍ! 
        // Si acabamos de hacer una venta, abrimos el ticket más reciente automáticamente.
        if (autoAbrirUltimoTicket && data.length > 0) {
          this.abrirTicket(data[0]); 
        }
      },
      error: () => {
        this.errorGlobal.set('No se pudo cargar el historial de ventas.');
        this.loading.set(false);
      }
    });
  }

  refrescarTablaDespuesDeVender() {
    this.cerrarModal(); // Cierra el modal del Punto de Venta
    this.cargarHistorial(true); // Recarga y le avisa que abra el ticket
  }

  // --- Funciones del POS ---
  abrirPOS() {
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
  }

  refrescarTabla() {
    this.cerrarModal();
    this.cargarHistorial();
  }

  // --- Funciones del Ticket ---
  abrirTicket(venta: VentaResponse) {
    this.ticketSeleccionado.set(venta);
    this.modalTicketAbierto.set(true);
  }

  cerrarTicket() {
    this.modalTicketAbierto.set(false);
    this.ticketSeleccionado.set(null);
  }
}