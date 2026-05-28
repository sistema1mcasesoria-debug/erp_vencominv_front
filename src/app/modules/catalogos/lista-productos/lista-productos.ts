import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../../core/services/producto.service';
import { Producto } from '../../../core/models/producto.model';
import { FormProducto } from '../form-producto/form-producto'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-lista-productos',
  standalone: true,
  imports: [CommonModule, FormProducto],
  templateUrl: './lista-productos.html',
})
export class ListaProductos implements OnInit {
  private productoService = inject(ProductoService);

  // Estados estructurales
  productos = signal<Producto[]>([]);
  loading = signal(false);
  errorGlobal = signal('');

  // Estados de control para invocar el Formulario Hijo
  modalAbierto = signal(false);
  productoSeleccionado = signal<Producto | null>(null);

  ngOnInit() {
    this.cargarCatalogoProductos();
  }

  cargarCatalogoProductos() {
    this.loading.set(true);
    this.errorGlobal.set('');

    this.productoService.obtenerProductos().subscribe({
      next: (data) => {
        // Ordenamos siempre de menor a mayor por ID
        const ordenado = data.sort((a, b) => a.id - b.id);
        this.productos.set(ordenado);
        this.loading.set(false);
      },
      error: () => {
        this.errorGlobal.set('No se pudo recuperar el inventario general de productos.');
        this.loading.set(false);
      }
    });
  }

  abrirCrear() {
    this.productoSeleccionado.set(null);
    this.modalAbierto.set(true);
  }

  abrirEditar(prod: Producto) {
    this.productoSeleccionado.set(prod);
    this.modalAbierto.set(true);
  }

  cerrarModalForm() {
    this.modalAbierto.set(false);
    this.productoSeleccionado.set(null);
  }

  manejarRefrescoTabla() {
    this.cerrarModalForm();
    this.cargarCatalogoProductos();
  }
}