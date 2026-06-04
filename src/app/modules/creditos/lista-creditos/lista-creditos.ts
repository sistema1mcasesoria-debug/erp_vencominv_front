// src/app/features/creditos/lista-creditos.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CreditosService } from '../../../core/services/creditos.service';
import { ReportesService } from '../../../core/services/reportes.service';

@Component({
  selector: 'app-lista-creditos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-creditos.html'
})
export class ListaCreditos implements OnInit {
  private creditosService = inject(CreditosService);
  private reportesService = inject(ReportesService);
  private sanitizer = inject(DomSanitizer);

  deudas = signal<any[]>([]);
  loading = signal<boolean>(true);
  errorGlobal = signal<string | null>(null);

  // --- BÚSQUEDA Y FILTRADO ---
  terminoBusqueda = signal('');
  
  deudasFiltradas = computed(() => {
    const term = this.terminoBusqueda().toLowerCase().trim();
    if (!term) return this.deudas();
    return this.deudas().filter(v => 
      (v.comprobante && v.comprobante.toLowerCase().includes(term)) ||
      (v.clienteNombre && v.clienteNombre.toLowerCase().includes(term)) ||
      (v.clienteDocumento && v.clienteDocumento.toLowerCase().includes(term))
    );
  });

  totalPorCobrar = computed(() => {
    return this.deudasFiltradas().reduce((acc, curr) => acc + curr.saldoPendiente, 0);
  });

  // --- REPORTES ---
  fechaInicio = signal('');
  fechaFin = signal('');
  tipoReporte = signal('creditos/pendientes');
  descargando = signal(false);
  
  viewerAbierto = signal<boolean>(false);
  tituloDocumento = signal<string>('');
  pdfUrlSegura = signal<SafeResourceUrl | null>(null);
  
  // Guardamos la URL cruda para limpiarla de la memoria RAM al cambiar de PDF
  private currentPdfUrl: string | null = null; 

  // --- MODAL DE PAGO ---
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

  // --- NUEVO: INTERCEPTOR DE FILTROS ---
  cambiarFiltroReporte(campo: 'tipo' | 'inicio' | 'fin', valor: string) {
    if (campo === 'tipo') this.tipoReporte.set(valor);
    if (campo === 'inicio') this.fechaInicio.set(valor);
    if (campo === 'fin') this.fechaFin.set(valor);

    // Si el visor está abierto y cambiamos algo, actualizamos el PDF automáticamente
    if (this.viewerAbierto()) {
      if (this.fechaInicio() && this.fechaFin()) {
        this.verDocumentoPdf();
      } else {
        this.cerrarVisor(); // Si borró una fecha, cerramos el visor
      }
    }
  }

  // --- LÓGICA DE REPORTES (PDF/EXCEL) ---
  verDocumentoPdf() {
    if (!this.fechaInicio() || !this.fechaFin()) return;

    this.descargando.set(true);
    const titulo = this.tipoReporte() === 'creditos/pendientes' ? 'Reporte de Cuentas por Cobrar' : 'Historial de Cobros';
    this.tituloDocumento.set(titulo);

    this.reportesService.descargarPdf(this.tipoReporte(), this.fechaInicio(), this.fechaFin()).subscribe({
      next: (blob) => {
        // Limpiamos el PDF anterior de la memoria RAM del navegador
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
    const nombreArchivo = this.tipoReporte() === 'creditos/pendientes' ? 'Cuentas_por_Cobrar' : 'Historial_Cobros';

    this.reportesService.descargarExcel(this.tipoReporte(), this.fechaInicio(), this.fechaFin()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${nombreArchivo}.xlsx`;
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

  // --- LÓGICA DEL MODAL DE PAGO ---
  abrirModalPago(venta: any) {
    this.ventaCobrar.set(venta);
    this.formAbono.set({ monto: venta.saldoPendiente, metodoPago: 'EFECTIVO', referencia: '' });
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
      this.errorGlobal.set('El monto ingresado no es válido.');
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
        this.cargarDeudas();
      },
      error: (err) => {
        this.errorGlobal.set(err.error?.message || 'Ocurrió un error al registrar el pago.');
        this.procesandoPago.set(false);
      }
    });
  }
}