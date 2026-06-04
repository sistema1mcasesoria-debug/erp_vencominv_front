// src/app/features/compras/lista-compras.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CompraService } from '../../../core/services/compra.service';
import { ReportesService } from '../../../core/services/reportes.service';
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
  private reportesService = inject(ReportesService);
  private sanitizer = inject(DomSanitizer);

  compras = signal<CompraResponse[]>([]);
  loading = signal(false);
  errorGlobal = signal('');

  // --- BÚSQUEDA Y FILTRADO EN TIEMPO REAL ---
  terminoBusqueda = signal('');
  
  comprasFiltradas = computed(() => {
    const term = this.terminoBusqueda().toLowerCase().trim();
    if (!term) return this.compras();
    return this.compras().filter(c => 
      (c.comprobante && c.comprobante.toLowerCase().includes(term)) ||
      (c.proveedorRazonSocial && c.proveedorRazonSocial.toLowerCase().includes(term)) ||
      (c.documentoIdentidad && c.documentoIdentidad.toLowerCase().includes(term))
    );
  });

  // --- NUEVO FLUJO DE REPORTES ---
  fechaInicio = signal('');
  fechaFin = signal('');
  tipoReporte = signal('compras'); // <-- Cambiado por defecto al Registro General
  descargando = signal(false);

  viewerAbierto = signal<boolean>(false);
  tituloDocumento = signal<string>('');
  pdfUrlSegura = signal<SafeResourceUrl | null>(null);
  private currentPdfUrl: string | null = null;

  // Control del modal de Nueva Compra
  modalAbierto = signal(false);

  // Control del Modal de Pago
  modalPagoAbierto = signal(false);
  compraAPagar = signal<CompraResponse | null>(null);
  procesandoPago = signal(false);

  formAbono = signal({
    monto: 0,
    metodoPago: 'TRANSFERENCIA',
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

  // --- LÓGICA DE REPORTES (PDF/EXCEL) ---
  cambiarFiltroReporte(campo: 'tipo' | 'inicio' | 'fin', valor: string) {
    if (campo === 'tipo') this.tipoReporte.set(valor);
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
    
    // 👇 NUEVA LÓGICA DE TÍTULOS
    let titulo = 'Reporte de Compras';
    if (this.tipoReporte() === 'compras/pendientes') titulo = 'Reporte de Cuentas por Pagar';
    else if (this.tipoReporte() === 'compras/pagos') titulo = 'Historial de Pagos';
    else if (this.tipoReporte() === 'compras') titulo = 'Registro Oficial de Compras';
    
    this.tituloDocumento.set(titulo);

    this.reportesService.descargarPdf(this.tipoReporte(), this.fechaInicio(), this.fechaFin()).subscribe({
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
    
    // 👇 NUEVA LÓGICA DE NOMBRES DE ARCHIVO
    let nombreArchivo = 'Compras';
    if (this.tipoReporte() === 'compras/pendientes') nombreArchivo = 'Cuentas_por_Pagar';
    else if (this.tipoReporte() === 'compras/pagos') nombreArchivo = 'Historial_Pagos';
    else if (this.tipoReporte() === 'compras') nombreArchivo = 'Registro_Compras';

    this.reportesService.descargarExcel(this.tipoReporte(), this.fechaInicio(), this.fechaFin()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${nombreArchivo}.xlsx`; // <-- Usa el nombre dinámico
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

  // --- Control General ---
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
      metodoPago: 'TRANSFERENCIA',
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
        this.cargarHistorial();
      },
      error: (err) => {
        this.procesandoPago.set(false);
        this.errorGlobal.set(err.error?.message || 'Error al registrar el pago al proveedor.');
      }
    });
  }
}