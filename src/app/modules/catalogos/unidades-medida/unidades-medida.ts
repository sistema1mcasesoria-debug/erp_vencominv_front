// src/app/features/catalogos/unidades-medida/unidades-medida.component.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UnidadMedidaService } from '../../../core/services/unidad-medida.service';
import { UnidadMedida, UnidadMedidaRequest } from '../../../core/models/unidad-medida.model';

@Component({
  selector: 'app-unidades-medida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './unidades-medida.html',
})
export class UnidadesMedida implements OnInit {
  private unidadService = inject(UnidadMedidaService);

  // Estados de la tabla
  unidades = signal<UnidadMedida[]>([]);
  loading = signal(false);
  errorGlobal = signal('');

  // Estados del Modal
  isOpenModal = signal(false);
  isEditMode = signal(false);
  unidadIdSeleccionada = signal<number | null>(null);
  submittingModal = signal(false);
  errorModal = signal('');

  // Propiedades del formulario
  formNombre = signal('');
  formAbreviatura = signal('');
  formPermiteFraccion = signal(false);

  ngOnInit() {
    this.cargarUnidades();
  }

  cargarUnidades() {
    this.loading.set(true);
    this.errorGlobal.set('');
    
    this.unidadService.obtenerUnidades().subscribe({
      next: (data) => {
        const listaOrdenada = data.sort((a, b) => a.id - b.id);
        this.unidades.set(listaOrdenada);
        this.loading.set(false);
      },
      error: () => {
        this.errorGlobal.set('No se pudo recuperar el catálogo de unidades de medida.');
        this.loading.set(false);
      }
    });
  }

  abrirModalCrear() {
    this.isEditMode.set(false);
    this.unidadIdSeleccionada.set(null);
    this.errorModal.set('');
    
    this.formNombre.set('');
    this.formAbreviatura.set('');
    this.formPermiteFraccion.set(false);
    
    this.isOpenModal.set(true);
  }

  abrirModalEditar(unidad: UnidadMedida) {
    this.isEditMode.set(true);
    this.unidadIdSeleccionada.set(unidad.id);
    this.errorModal.set('');
    
    this.formNombre.set(unidad.nombre);
    this.formAbreviatura.set(unidad.abreviatura);
    this.formPermiteFraccion.set(unidad.permiteFraccion);
    
    this.isOpenModal.set(true);
  }

  cerrarModal() {
    this.isOpenModal.set(false);
  }

  toggleFraccion() {
    this.formPermiteFraccion.update(v => !v);
  }

  guardarUnidad() {
    if (!this.formNombre().trim() || !this.formAbreviatura().trim()) {
      this.errorModal.set('El nombre y la abreviatura son campos obligatorios.');
      return;
    }

    this.submittingModal.set(true);
    this.errorModal.set('');

    const payload: UnidadMedidaRequest = {
      nombre: this.formNombre().trim(),
      abreviatura: this.formAbreviatura().trim(),
      permiteFraccion: this.formPermiteFraccion()
    };

    const request$ = this.isEditMode()
      ? this.unidadService.actualizarUnidad(this.unidadIdSeleccionada()!, payload)
      : this.unidadService.crearUnidad(payload);

    request$.subscribe({
      next: () => {
        this.submittingModal.set(false);
        this.cerrarModal();
        this.cargarUnidades();
      },
      error: (err) => {
        this.submittingModal.set(false);
        this.errorModal.set(err.error?.message || err.error?.error || 'Error al procesar la unidad de medida.');
      }
    });
  }
}