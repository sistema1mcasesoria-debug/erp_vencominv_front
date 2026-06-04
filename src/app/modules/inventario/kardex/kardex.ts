// src/app/features/inventario/kardex/kardex.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // <-- IMPORTANTE PARA EL VISOR

import { KardexService } from '../../../core/services/kardex.service';
import { ProductoService } from '../../../core/services/producto.service';
import { LoteService } from '../../../core/services/lote.service';
import { ReportesService } from '../../../core/services/reportes.service'; // <-- NUEVO

import { KardexResponse, KardexAjusteRequest } from '../../../core/models/kardex.model';
import { Producto } from '../../../core/models/producto.model';
import { LoteResponse } from '../../../core/models/compra.model';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kardex.html'
})
export class Kardex implements OnInit {
  private kardexService = inject(KardexService);
  private productoService = inject(ProductoService);
  private loteService = inject(LoteService);
  private reportesService = inject(ReportesService); // <-- INYECTADO
  private sanitizer = inject(DomSanitizer);          // <-- INYECTADO

  // Estados Globales
  loading = signal(false);
  errorGlobal = signal('');
  
  // Datos
  productos = signal<Producto[]>([]);
  productoSeleccionadoId = signal<number | null>(null);
  movimientos = signal<KardexResponse[]>([]);

  // --- NUEVO: ESTADOS PARA REPORTES ---
  fechaInicio = signal('');
  fechaFin = signal('');
  descargando = signal(false);
  viewerAbierto = signal<boolean>(false);
  tituloDocumento = signal<string>('');
  pdfUrlSegura = signal<SafeResourceUrl | null>(null);

  // Modal Ajuste
  modalAjusteAbierto = signal(false);
  submittingAjuste = signal(false);
  lotesDisponibles = signal<LoteResponse[]>([]);
  formAjuste = signal<KardexAjusteRequest>({ loteId: 0, cantidad: 0, motivo: '' });

  ngOnInit() {
    this.productoService.obtenerProductos().subscribe(data => this.productos.set(data));
  }

  cargarHistorial(productoId: number) {
    this.productoSeleccionadoId.set(productoId);
    this.loading.set(true);
    this.viewerAbierto.set(false); // Cerramos el visor si cambia de producto
    this.kardexService.historialPorProducto(productoId).subscribe({
      next: (data) => {
        this.movimientos.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // --- NUEVO: LÓGICA DE REPORTES (PDF/EXCEL) ---
  verDocumentoPdf() {
    if (!this.fechaInicio() || !this.fechaFin() || !this.productoSeleccionadoId()) return;

    this.descargando.set(true);
    this.tituloDocumento.set('Auditoría Kardex del Producto');

    // Le pasamos el productoSeleccionadoId() como cuarto parámetro
    this.reportesService.descargarPdf('kardex', this.fechaInicio(), this.fechaFin(), this.productoSeleccionadoId()!).subscribe({
      next: (blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        this.pdfUrlSegura.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
        this.viewerAbierto.set(true);
        this.descargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el PDF:', err);
        this.errorGlobal.set('Error al generar el PDF del Kardex.');
        this.descargando.set(false);
      }
    });
  }

  descargarExcelDirecto() {
    if (!this.fechaInicio() || !this.fechaFin() || !this.productoSeleccionadoId()) return;

    this.descargando.set(true);

    this.reportesService.descargarExcel('kardex', this.fechaInicio(), this.fechaFin(), this.productoSeleccionadoId()!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Kardex_Producto_${this.productoSeleccionadoId()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.descargando.set(false);
      },
      error: (err) => {
        console.error('Error al descargar el Excel:', err);
        this.errorGlobal.set('Error al descargar el Excel del Kardex.');
        this.descargando.set(false);
      }
    });
  }

  cerrarVisor() {
    this.viewerAbierto.set(false);
    this.pdfUrlSegura.set(null);
  }

  // --- Lógica del Modal de Ajustes (Mantenida igual) ---
  abrirModalAjuste() {
    if (!this.productoSeleccionadoId()) {
      alert("Selecciona un producto primero para poder ajustar sus lotes.");
      return;
    }
    this.loteService.obtenerLotesActivos().subscribe(lotes => {
      const lotesDelProducto = lotes.filter(l => l.productoId === this.productoSeleccionadoId());
      this.lotesDisponibles.set(lotesDelProducto);
      this.formAjuste.set({ loteId: 0, cantidad: 0, motivo: '' });
      this.modalAjusteAbierto.set(true);
    });
  }

  guardarAjuste() {
    if (!this.formAjuste().loteId || this.formAjuste().cantidad === 0 || !this.formAjuste().motivo) {
      this.errorGlobal.set('Completa todos los campos. La cantidad no puede ser cero.');
      return;
    }
    this.submittingAjuste.set(true);
    this.kardexService.registrarAjuste(this.formAjuste()).subscribe({
      next: () => {
        this.submittingAjuste.set(false);
        this.modalAjusteAbierto.set(false);
        this.cargarHistorial(this.productoSeleccionadoId()!);
      },
      error: (err) => {
        this.errorGlobal.set(err.error?.message || 'Error al registrar el ajuste');
        this.submittingAjuste.set(false);
      }
    });
  }
}