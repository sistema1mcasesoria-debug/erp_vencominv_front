import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompraService } from '../../../core/services/compra.service';
import { CompraResponse } from '../../../core/models/compra.model';
import { NuevaCompra } from '../nueva-compra/nueva-compra';

@Component({
  selector: 'app-lista-compras',
  standalone: true,
  imports: [CommonModule, NuevaCompra],
  templateUrl: './lista-compras.html',
})
export class ListaCompras implements OnInit {
  private compraService = inject(CompraService);

  compras = signal<CompraResponse[]>([]);
  loading = signal(false);
  errorGlobal = signal('');
  modalAbierto = signal(false);

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
}