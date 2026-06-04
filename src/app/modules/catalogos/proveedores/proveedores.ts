import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { Proveedor, ProveedorRequest } from '../../../core/models/proveedor.model';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedores.html',
})
export class Proveedores implements OnInit {
  private proveedorService = inject(ProveedorService);
  private reportesService = inject(ReportesService);
  private sanitizer = inject(DomSanitizer);

  proveedores = signal<Proveedor[]>([]);
  loading = signal(false);
  errorGlobal = signal('');

  terminoBusqueda = signal('');
  
  proveedoresFiltrados = computed(() => {
    const termino = this.terminoBusqueda().toLowerCase().trim();
    if (!termino) {
      return this.proveedores();
    }
    return this.proveedores().filter(p => 
      p.razonSocial.toLowerCase().includes(termino) || 
      p.documentoIdentidad.toLowerCase().includes(termino)
    );
  });

  fechaInicio = signal('');
  fechaFin = signal('');
  descargando = signal(false);
  
  viewerAbierto = signal<boolean>(false);
  tituloDocumento = signal<string>('');
  pdfUrlSegura = signal<SafeResourceUrl | null>(null);

  isOpenModal = signal(false);
  isEditMode = signal(false);
  proveedorIdSeleccionado = signal<number | null>(null);
  submittingModal = signal(false);
  errorModal = signal('');
  buscandoRuc = signal(false);

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

  verDocumentoPdf() {
    if (!this.fechaInicio() || !this.fechaFin()) return;

    this.descargando.set(true);
    this.tituloDocumento.set('Directorio de Proveedores');

    this.reportesService.descargarPdf('proveedores', this.fechaInicio(), this.fechaFin()).subscribe({
      next: (blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        this.pdfUrlSegura.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
        this.viewerAbierto.set(true);
        this.descargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el PDF:', err);
        this.errorGlobal.set('Error al generar el PDF de proveedores.');
        this.descargando.set(false);
      }
    });
  }

  descargarExcelDirecto() {
    if (!this.fechaInicio() || !this.fechaFin()) return;

    this.descargando.set(true);

    this.reportesService.descargarExcel('proveedores', this.fechaInicio(), this.fechaFin()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_PROVEEDORES.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.descargando.set(false);
      },
      error: (err) => {
        console.error('Error al descargar el Excel:', err);
        this.errorGlobal.set('Error al descargar el Excel de proveedores.');
        this.descargando.set(false);
      }
    });
  }

  cerrarVisor() {
    this.viewerAbierto.set(false);
    this.pdfUrlSegura.set(null);
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

  buscarEnSunat() {
    const doc = this.formDocumento().trim();
    
    if (!doc || doc.length !== 11) {
      this.errorModal.set('La consulta automatizada requiere un número de RUC válido (11 dígitos).');
      return;
    }

    this.buscandoRuc.set(true);
    this.errorModal.set('');

    this.proveedorService.consultarRucSunat(doc).subscribe({
      next: (res: any) => {
        this.buscandoRuc.set(false);
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