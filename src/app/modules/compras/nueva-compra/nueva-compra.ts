import { Component, OnInit, signal, computed, inject, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProveedorService } from '../../../core/services/proveedor.service';
import { ProductoService } from '../../../core/services/producto.service';
import { CompraService } from '../../../core/services/compra.service';
import { Proveedor } from '../../../core/models/proveedor.model';
import { Producto } from '../../../core/models/producto.model';
import { CompraRequest, CompraDetalleRequest } from '../../../core/models/compra.model';

@Component({
  selector: 'app-nueva-compra',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-compra.html',
})
export class NuevaCompra implements OnInit {
  private proveedorService = inject(ProveedorService);
  private productoService = inject(ProductoService);
  private compraService = inject(CompraService);

  isOpen = input<boolean>(false);
  onCerrar = output<void>();
  onGuardadoExitoso = output<void>();

  condicionPago = signal<'CONTADO' | 'CREDITO'>('CONTADO');
  diasCredito = signal<number>(15);
  pagoInicial = signal<number>(0);
  metodoPagoInicial = signal<string>('EFECTIVO');
  
  // 👇 NUEVA SEÑAL PARA EL IGV (Por defecto 18%)
  igvSeleccionado = signal<number>(18);

  proveedores = signal<Proveedor[]>([]);
  productos = signal<Producto[]>([]);

  busquedaProveedor = signal('');
  proveedorSeleccionado = signal<Proveedor | null>(null);
  dropdownAbierto = signal(false);
  
  proveedoresFiltrados = computed(() => {
    const term = this.busquedaProveedor().toLowerCase();
    return this.proveedores().filter(p => p.razonSocial.toLowerCase().includes(term));
  });

  formComprobante = signal('');
  detalles = signal<CompraDetalleRequest[]>([]);
  submitting = signal(false);
  errorGlobal = signal('');

  totalCompra = computed(() => {
    return this.detalles().reduce((acc, item) => acc + (item.cantidad * item.costoUnitario), 0);
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetearFormulario(); // Usamos resetearFormulario para limpiar todo de golpe
      }
    });
  }

  ngOnInit() {
    this.proveedorService.obtenerProveedores().subscribe(data => this.proveedores.set(data));
    this.productoService.obtenerProductos().subscribe(data => this.productos.set(data));
  }

  seleccionarProveedor(p: Proveedor) {
    this.proveedorSeleccionado.set(p);
    this.busquedaProveedor.set(p.razonSocial);
    this.dropdownAbierto.set(false);
  }

  abrirDropdown() {
    this.dropdownAbierto.set(true);
    if (this.proveedorSeleccionado() && this.busquedaProveedor() !== this.proveedorSeleccionado()?.razonSocial) {
      this.proveedorSeleccionado.set(null);
    }
  }

  agregarFila() {
    this.detalles.update(d => [...d, { productoId: 0, codigoLote: '', cantidad: 1, costoUnitario: 0, fechaVencimiento: '' }]);
  }

  removerFila(index: number) {
    this.detalles.update(d => d.filter((_, i) => i !== index));
  }

  actualizarFila(index: number, campo: keyof CompraDetalleRequest, evento: any) {
    const valor = evento.target.value;
    this.detalles.update(d => {
      const nuevos = [...d];
      (nuevos[index] as any)[campo] = campo === 'productoId' || campo === 'cantidad' || campo === 'costoUnitario' ? Number(valor) : valor;
      return nuevos;
    });
  }

  guardar() {
    if (!this.proveedorSeleccionado() || !this.formComprobante().trim()) {
      this.errorGlobal.set('El Proveedor y el N° de Comprobante son obligatorios.');
      return;
    }
    
    const validos = this.detalles().filter(d => d.productoId > 0 && d.cantidad > 0 && d.costoUnitario > 0);
    if (validos.length === 0) {
      this.errorGlobal.set('Debe ingresar al menos un ítem con cantidad y costo válidos.');
      return;
    }

    if (this.condicionPago() === 'CREDITO' && this.pagoInicial() > this.totalCompra()) {
      this.errorGlobal.set('El adelanto inicial no puede ser mayor al total de la compra.');
      return;
    }

    this.submitting.set(true);
    this.errorGlobal.set('');

    const payload: CompraRequest = {
      proveedorId: this.proveedorSeleccionado()!.id,
      comprobante: this.formComprobante().trim().toUpperCase(),
      condicionPago: this.condicionPago(),
      diasCredito: this.condicionPago() === 'CREDITO' ? this.diasCredito() : null,
      pagoInicial: this.condicionPago() === 'CREDITO' ? this.pagoInicial() : null,
      metodoPagoInicial: this.condicionPago() === 'CREDITO' ? this.metodoPagoInicial() : null,
      
      // 👇 AÑADIMOS EL IGV SELECCIONADO AL PAYLOAD
      igvPorcentaje: this.igvSeleccionado(),

      detalles: validos
    };

    this.compraService.registrarCompra(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.onGuardadoExitoso.emit();
        this.resetearFormulario(); 
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorGlobal.set(err.error || 'Error del servidor al procesar la compra.');
      }
    });
  }

  resetearFormulario() {
      this.formComprobante.set('');
      this.busquedaProveedor.set('');
      this.proveedorSeleccionado.set(null);
      this.errorGlobal.set('');
      this.detalles.set([{ productoId: 0, codigoLote: '', cantidad: 1, costoUnitario: 0, fechaVencimiento: '' }]);
      this.condicionPago.set('CONTADO');
      this.diasCredito.set(15);
      this.pagoInicial.set(0);
      this.metodoPagoInicial.set('EFECTIVO');
      // 👇 RESETEAMOS EL IGV A 18% POR DEFECTO
      this.igvSeleccionado.set(18);
  }

  cerrar() {
    this.resetearFormulario();
    this.onCerrar.emit();
  }
}