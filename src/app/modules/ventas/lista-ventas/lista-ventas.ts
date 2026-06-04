// src/app/features/ventas/lista-ventas/lista-ventas.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VentaService } from '../../../core/services/venta.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { VentaResponse } from '../../../core/models/venta.model';
import { NuevaVenta } from '../nueva-venta/nueva-venta'; 
import { VentaTicket } from '../venta-ticket/venta-ticket'; 

@Component({
  selector: 'app-lista-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, NuevaVenta, VentaTicket], 
  templateUrl: './lista-ventas.html',
})
export class ListaVentas implements OnInit {
  private ventaService = inject(VentaService);
  private reportesService = inject(ReportesService);
  private sanitizer = inject(DomSanitizer);

  ventas = signal<VentaResponse[]>([]);
  loading = signal(false);
  errorGlobal = signal('');

  // --- BÚSQUEDA Y FILTRADO EN TIEMPO REAL ---
  terminoBusqueda = signal('');
  
  ventasFiltradas = computed(() => {
    const term = this.terminoBusqueda().toLowerCase().trim();
    if (!term) return this.ventas();
    return this.ventas().filter(v => 
      (v.comprobante && v.comprobante.toLowerCase().includes(term)) ||
      (v.clienteNombre && v.clienteNombre.toLowerCase().includes(term)) ||
      (v.clienteDocumento && v.clienteDocumento.includes(term))
    );
  });

  // --- NUEVO FLUJO DE REPORTES ---
  fechaInicio = signal('');
  fechaFin = signal('');
  descargando = signal(false);
  
  viewerAbierto = signal<boolean>(false);
  tituloDocumento = signal<string>('');
  pdfUrlSegura = signal<SafeResourceUrl | null>(null);
  private currentPdfUrl: string | null = null;

  // Control del modal POS (Nueva Venta)
  modalAbierto = signal(false);

  // Control del modal de Previsualización (Ticket)
  ticketSeleccionado = signal<VentaResponse | null>(null);
  modalTicketAbierto = signal(false);

  ngOnInit() {
    this.cargarHistorial();
  }

  cargarHistorial(autoAbrirUltimoTicket: boolean = false) {
    this.loading.set(true);
    this.errorGlobal.set('');

    this.ventaService.obtenerVentas().subscribe({
      next: (data) => {
        this.ventas.set(data);
        this.loading.set(false);

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

  // --- LÓGICA DE REPORTES (PDF/EXCEL) ---
  cambiarFiltroReporte(campo: 'inicio' | 'fin', valor: string) {
    if (campo === 'inicio') this.fechaInicio.set(valor);
    if (campo === 'fin') this.fechaFin.set(valor);

    if (this.viewerAbierto()) {
      if (this.fechaInicio() && this.fechaFin()) {
        this.verDocumentoPdf();
      } else {
        this.cerrarVisor();
      }
    }
  }

  verDocumentoPdf() {
    if (!this.fechaInicio() || !this.fechaFin()) return;

    this.descargando.set(true);
    this.tituloDocumento.set('Registro Oficial de Ventas');

    this.reportesService.descargarPdf('ventas', this.fechaInicio(), this.fechaFin()).subscribe({
      next: (blob) => {
        if (this.currentPdfUrl) {
          window.URL.revokeObjectURL(this.currentPdfUrl);
        }
        this.currentPdfUrl = window.URL.createObjectURL(blob);
        this.pdfUrlSegura.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.currentPdfUrl));
        this.viewerAbierto.set(true);
        this.descargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el PDF:', err);
        this.errorGlobal.set('Error al generar el PDF.');
        this.descargando.set(false);
      }
    });
  }

  descargarExcelDirecto() {
    if (!this.fechaInicio() || !this.fechaFin()) return;

    this.descargando.set(true);

    this.reportesService.descargarExcel('ventas', this.fechaInicio(), this.fechaFin()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Registro_Ventas.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.descargando.set(false);
      },
      error: (err) => {
        console.error('Error al descargar el Excel:', err);
        this.errorGlobal.set('Error al descargar el Excel.');
        this.descargando.set(false);
      }
    });
  }

  cerrarVisor() {
    this.viewerAbierto.set(false);
    this.pdfUrlSegura.set(null);
    if (this.currentPdfUrl) {
      window.URL.revokeObjectURL(this.currentPdfUrl);
      this.currentPdfUrl = null;
    }
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

  refrescarTablaDespuesDeVender() {
    this.cerrarModal(); 
    this.cargarHistorial(true); 
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