import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../../core/services/categoria.service';
import { Categoria, CategoriaRequest } from '../../../core/models/categoria.model';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias.html',
})
export class Categorias implements OnInit {
  private categoriaService = inject(CategoriaService);

  // Estados de la tabla
  categorias = signal<Categoria[]>([]);
  loading = signal(false);
  errorGlobal = signal('');

  // Estados del Modal Integrado
  isOpenModal = signal(false);
  isEditMode = signal(false);
  categoriaIdSeleccionada = signal<number | null>(null);
  submittingModal = signal(false);
  errorModal = signal('');

  // Propiedades del formulario
  formNombre = signal('');
  formDescripcion = signal('');

  ngOnInit() {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.loading.set(true);
    this.errorGlobal.set('');
    
    this.categoriaService.obtenerCategoriasActivas().subscribe({
      next: (data) => {
        // Ordenamos el arreglo de menor a mayor basado en el ID antes de asignarlo al Signal
        const listaOrdenada = data.sort((a, b) => a.id - b.id);
        
        this.categorias.set(listaOrdenada);
        this.loading.set(false);
      },
      error: () => {
        this.errorGlobal.set('No se pudo recuperar el catálogo de categorías.');
        this.loading.set(false);
      }
    });
  }

  abrirModalCrear() {
    this.isEditMode.set(false);
    this.categoriaIdSeleccionada.set(null);
    this.errorModal.set('');
    this.formNombre.set('');
    this.formDescripcion.set('');
    this.isOpenModal.set(true);
  }

  abrirModalEditar(categoria: Categoria) {
    this.isEditMode.set(true);
    this.categoriaIdSeleccionada.set(categoria.id);
    this.errorModal.set('');
    this.formNombre.set(categoria.nombre);
    this.formDescripcion.set(categoria.descripcion);
    this.isOpenModal.set(true);
  }

  cerrarModal() {
    this.isOpenModal.set(false);
  }

  guardarCategoria() {
    if (!this.formNombre().trim() || !this.formDescripcion().trim()) {
      this.errorModal.set('Todos los campos son obligatorios.');
      return;
    }

    this.submittingModal.set(true);
    this.errorModal.set('');

    const payload: CategoriaRequest = {
      nombre: this.formNombre().trim(),
      descripcion: this.formDescripcion().trim()
    };

    const request$ = this.isEditMode()
      ? this.categoriaService.actualizarCategoria(this.categoriaIdSeleccionada()!, payload)
      : this.categoriaService.crearCategoria(payload);

    request$.subscribe({
      next: () => {
        this.submittingModal.set(false);
        this.cerrarModal();
        this.cargarCategorias();
      },
      error: (err) => {
        this.submittingModal.set(false);
        this.errorModal.set(err.error?.message || err.error?.error || 'Error al procesar la categoría.');
      }
    });
  }

  alternarEstado(categoria: Categoria) {
    const accion = categoria.estado ? 'desactivar' : 'activar';
    if (confirm(`¿Está seguro de que desea ${accion} la categoría "${categoria.nombre}"?`)) {
      
      if (categoria.estado) {
        // Si está activa, ejecutamos el PATCH de desactivación
        this.categoriaService.desactivarCategoria(categoria.id).subscribe({
          next: () => this.cargarCategorias(),
          error: () => this.errorGlobal.set('No se pudo suspender la categoría.')
        });
      } else {
        this.categoriaService.activarCategoria(categoria.id).subscribe({
          next: () => this.cargarCategorias(),
          error: () => this.errorGlobal.set('No se pudo suspender la categoría.')
        });
      }

    }
  }
}
