// src/app/features/inventario/lotes/lotes.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { LoteService } from '../../../core/services/lote.service'; // <-- NUEVO
import { Producto } from '../../../core/models/producto.model';
import { LoteResponse } from '../../../core/models/compra.model';

interface ProductoInventario extends Producto {
  lotesActivos: LoteResponse[];
  estaAbierto: boolean;
}

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lotes.html',
})
export class Lotes implements OnInit {
  private productoService = inject(ProductoService);
  private loteService = inject(LoteService); // <-- NUEVO

  inventarioRaw = signal<ProductoInventario[]>([]);
  loading = signal(false);
  errorGlobal = signal('');
  filtroBusqueda = signal('');

  inventarioFiltrado = computed(() => {
    const termino = this.filtroBusqueda().toLowerCase().trim();
    if (!termino) return this.inventarioRaw();
    return this.inventarioRaw().filter(p => 
      p.nombre.toLowerCase().includes(termino) || (p.codigoBarras && p.codigoBarras.includes(termino))
    );
  });

  ngOnInit() {
    this.cargarInventarioConsolidado();
  }

  cargarInventarioConsolidado() {
    this.loading.set(true);
    this.errorGlobal.set('');

    // Pedimos los productos (Master)
    this.productoService.obtenerProductos().subscribe({
      next: (productosData) => {
        // Pedimos directamente los lotes activos (Stock Físico)
        this.loteService.obtenerLotesActivos().subscribe({
          next: (lotesData) => {
            const consolidado = productosData.map(p => {
              // Asignamos a cada producto sus lotes correspondientes
              const lotesDelProducto = lotesData.filter(l => l.productoId === p.id);

              return {
                ...p,
                lotesActivos: lotesDelProducto || [],
                estaAbierto: false
              };
            });

            this.inventarioRaw.set(consolidado.sort((a, b) => a.id - b.id));
            this.loading.set(false);
          },
          error: () => this.manejarError()
        });
      },
      error: () => this.manejarError()
    });
  }

  toggleProducto(prodId: number) {
    this.inventarioRaw.update(productos => 
      productos.map(p => p.id === prodId ? { ...p, estaAbierto: !p.estaAbierto } : p)
    );
  }

  esLoteVencido(fechaVencimiento: string): boolean {
    if (!fechaVencimiento) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaVenc = new Date(fechaVencimiento);
    return fechaVenc <= hoy;
  }

  private manejarError() {
    this.errorGlobal.set('No se pudo sincronizar el inventario por lotes.');
    this.loading.set(false);
  }
}