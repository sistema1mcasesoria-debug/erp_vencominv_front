// src/app/features/catalogos/proveedores/proveedores.component.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { Proveedor, ProveedorRequest } from '../../../core/models/proveedor.model';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
})
export class Proveedores implements OnInit {
  private proveedorService = inject(ProveedorService);

  // Estados de la tabla
  proveedores = signal<Proveedor[]>([]);
  loading = signal(false);
  errorGlobal = signal('');

  // Estados del Modal
  isOpenModal = signal(false);
  isEditMode = signal(false);
  proveedorIdSeleccionado = signal<number | null>(null);
  submittingModal = signal(false);
  errorModal = signal('');
  buscandoRuc = signal(false);

  // Propiedades del formulario (Signals)
  formRazonSocial = signal('');
  formDocumento = signal('');
  formTelefono = signal('');
  formEmail = signal('');

  ngOnInit() {
    this.cargarProveedores();
  }

  cargarProveedores() {
    this.loading.set(true);
    this.errorGlobal.set('');
    
    this.proveedorService.obtenerProveedores().subscribe({
      next: (data) => {
        const listaOrdenada = data.sort((a, b) => a.id - b.id);
        this.proveedores.set(listaOrdenada);
        this.loading.set(false);
      },
      error: () => {
        this.errorGlobal.set('No se pudo recuperar el catálogo de proveedores.');
        this.loading.set(false);
      }
    });
  }

  abrirModalCrear() {
    this.isEditMode.set(false);
    this.proveedorIdSeleccionado.set(null);
    this.errorModal.set('');
    
    this.formRazonSocial.set('');
    this.formDocumento.set('');
    this.formTelefono.set('');
    this.formEmail.set('');
    
    this.isOpenModal.set(true);
  }

  abrirModalEditar(proveedor: Proveedor) {
    this.isEditMode.set(true);
    this.proveedorIdSeleccionado.set(proveedor.id);
    this.errorModal.set('');
    
    this.formRazonSocial.set(proveedor.razonSocial);
    this.formDocumento.set(proveedor.documentoIdentidad);
    this.formTelefono.set(proveedor.telefono);
    this.formEmail.set(proveedor.email);
    
    this.isOpenModal.set(true);
  }

  cerrarModal() {
    this.isOpenModal.set(false);
  }

  // --- LÓGICA SUNAT CORREGIDA ---
  buscarEnSunat() {
    const doc = this.formDocumento().trim();
    
    // SUNAT opera con RUC (11 dígitos). Si es un DNI (8 dígitos), dejamos que lo escriban a mano.
    if (!doc || doc.length !== 11) {
      this.errorModal.set('La consulta automatizada requiere un número de RUC válido (11 dígitos).');
      return;
    }

    this.buscandoRuc.set(true);
    this.errorModal.set('');

    this.proveedorService.consultarRucSunat(doc).subscribe({
      next: (res: any) => {
        this.buscandoRuc.set(false);
        
        // Mapeo elástico e inteligente para tolerar cualquier estructura del DTO
        const razonSocialObtenida = res?.razonSocial || res?.razon_social;
        const estadoObtenido = res?.estado;

        if (razonSocialObtenida) {
          this.formRazonSocial.set(razonSocialObtenida);
          
          if (estadoObtenido && estadoObtenido !== 'ACTIVO') {
            this.errorModal.set(`Aviso: El contribuyente se encuentra en estado ${estadoObtenido}.`);
          }
        } else {
          this.errorModal.set('La API respondió pero no se localizó la Razón Social.');
        }
      },
      error: (err) => {
        this.buscandoRuc.set(false);
        this.errorModal.set(err.error?.message || 'No se pudo obtener respuesta del puente SUNAT.');
      }
    });
  }

  guardarProveedor() {
    if (!this.formRazonSocial().trim() || !this.formDocumento().trim()) {
      this.errorModal.set('La Razón Social y el Documento son obligatorios.');
      return;
    }

    this.submittingModal.set(true);
    this.errorModal.set('');

    const payload: ProveedorRequest = {
      razonSocial: this.formRazonSocial().trim(),
      documentoIdentidad: this.formDocumento().trim(),
      telefono: this.formTelefono().trim(),
      email: this.formEmail().trim()
    };

    const request$ = this.isEditMode()
      ? this.proveedorService.actualizarProveedor(this.proveedorIdSeleccionado()!, payload)
      : this.proveedorService.crearProveedor(payload);

    request$.subscribe({
      next: () => {
        this.submittingModal.set(false);
        this.cerrarModal();
        this.cargarProveedores();
      },
      error: (err) => {
        this.submittingModal.set(false);
        this.errorModal.set(err.error?.message || err.error?.error || 'Error al guardar el proveedor.');
      }
    });
  }
}