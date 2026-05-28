// src/app/features/inventario/kardex/kardex.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KardexService } from '../../../core/services/kardex.service';
import { ProductoService } from '../../../core/services/producto.service';
import { LoteService } from '../../../core/services/lote.service'; // Para sacar los lotes al ajustar
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

  // Estados
  loading = signal(false);
  errorGlobal = signal('');
  
  // Datos
  productos = signal<Producto[]>([]);
  productoSeleccionadoId = signal<number | null>(null);
  movimientos = signal<KardexResponse[]>([]);

  // Modal Ajuste
  modalAjusteAbierto = signal(false);
  submittingAjuste = signal(false);
  lotesDisponibles = signal<LoteResponse[]>([]);
  
  formAjuste = signal<KardexAjusteRequest>({ loteId: 0, cantidad: 0, motivo: '' });

  ngOnInit() {
    // Cargamos los productos para el selector principal
    this.productoService.obtenerProductos().subscribe(data => this.productos.set(data));
  }

  // Se dispara al elegir un producto en el dropdown
  cargarHistorial(productoId: number) {
    this.productoSeleccionadoId.set(productoId);
    this.loading.set(true);
    this.kardexService.historialPorProducto(productoId).subscribe({
      next: (data) => {
        this.movimientos.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // --- Lógica del Modal de Ajustes ---
  abrirModalAjuste() {
    if (!this.productoSeleccionadoId()) {
      alert("Selecciona un producto primero para poder ajustar sus lotes.");
      return;
    }
    
    // Traemos los lotes de ese producto para que el usuario elija cuál ajustar
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
        // Refrescamos la tabla
        this.cargarHistorial(this.productoSeleccionadoId()!);
      },
      error: (err) => {
        this.errorGlobal.set(err.error?.message || 'Error al registrar el ajuste');
        this.submittingAjuste.set(false);
      }
    });
  }
}