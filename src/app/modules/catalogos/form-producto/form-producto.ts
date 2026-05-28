import { Component, inject, signal, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../../core/services/producto.service';
import { CategoriaService } from '../../../core/services/categoria.service';
import { UnidadMedidaService } from '../../../core/services/unidad-medida.service';
import { Categoria } from '../../../core/models/categoria.model';
import { UnidadMedida } from '../../../core/models/unidad-medida.model';
import { Producto, ProductoRequest } from '../../../core/models/producto.model';

@Component({
  selector: 'app-form-producto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-producto.html',
})
export class FormProducto {
  private productoService = inject(ProductoService);
  private categoriaService = inject(CategoriaService);
  private unidadService = inject(UnidadMedidaService);

  // Inputs/Outputs reactivos desde el padre
  isOpen = input<boolean>(false);
  productoParaEditar = input<Producto | null>(null);
  
  onCerrar = output<void>();
  onGuardadoExitoso = output<void>();

  // Catálogos auxiliares de selección
  categoriasActivas = signal<Categoria[]>([]);
  unidadesMedida = signal<UnidadMedida[]>([]);

  // Estados del Formulario
  isEditMode = signal(false);
  submitting = signal(false);
  errorModal = signal('');

  // Propiedades vinculadas a la UI
  formCodigoBarras = signal('');
  formNombre = signal('');
  formCategoriaId = signal<number | null>(null);
  formUnidadMedidaId = signal<number | null>(null);
  formPrecioVenta = signal<number | null>(null);

  constructor() {
    this.cargarCatalogosAuxiliares();

    // Sincronización elástica al alternar entre creación y edición
    effect(() => {
      const prod = this.productoParaEditar();
      if (prod) {
        this.isEditMode.set(true);
        this.formCodigoBarras.set(prod.codigoBarras);
        this.formNombre.set(prod.nombre);
        this.formCategoriaId.set(prod.categoriaId);
        this.formUnidadMedidaId.set(prod.unidadMedidaId);
        this.formPrecioVenta.set(prod.precioVenta);
      } else {
        this.isEditMode.set(false);
        this.formCodigoBarras.set('');
        this.formNombre.set('');
        this.formCategoriaId.set(null);
        this.formUnidadMedidaId.set(null);
        this.formPrecioVenta.set(null);
      }
      this.errorModal.set('');
    });
  }

  private cargarCatalogosAuxiliares() {
    this.categoriaService.obtenerCategoriasActivas().subscribe({
      next: (cats) => this.categoriasActivas.set(cats)
    });
    this.unidadService.obtenerUnidades().subscribe({
      next: (unidades) => this.unidadesMedida.set(unidades)
    });
  }

  cerrar() {
    this.onCerrar.emit();
  }

  guardarProducto() {
    if (!this.formNombre().trim() || !this.formCategoriaId() || !this.formUnidadMedidaId() || this.formPrecioVenta() === null) {
      this.errorModal.set('Todos los campos marcados con (*) son estrictamente obligatorios.');
      return;
    }

    this.submitting.set(true);
    this.errorModal.set('');

    const payload: ProductoRequest = {
      codigoBarras: this.formCodigoBarras().trim(),
      nombre: this.formNombre().trim(),
      categoriaId: Number(this.formCategoriaId()),
      unidadMedidaId: Number(this.formUnidadMedidaId()),
      precioVenta: Number(this.formPrecioVenta())
    };

    const request$ = this.isEditMode()
      ? this.productoService.actualizarProducto(this.productoParaEditar()!.id, payload)
      : this.productoService.crearProducto(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.onGuardadoExitoso.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorModal.set(err.error?.message || err.error?.error || 'Error de validación en los parámetros del producto.');
      }
    });
  }
}