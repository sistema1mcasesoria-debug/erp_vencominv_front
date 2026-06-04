// src/app/features/ventas/nueva-venta/nueva-venta.ts
import { Component, OnInit, signal, computed, inject, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { ProductoService } from '../../../core/services/producto.service';
import { VentaService } from '../../../core/services/venta.service';
import { ClienteResponse, ClienteRequest } from '../../../core/models/cliente.model';
import { Producto } from '../../../core/models/producto.model';
import { VentaRequest } from '../../../core/models/venta.model';

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

@Component({
  selector: 'app-nueva-venta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-venta.html',
})
export class NuevaVenta implements OnInit {
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private ventaService = inject(VentaService);

  isOpen = input<boolean>(false);
  onCerrar = output<void>();
  onGuardadoExitoso = output<void>();

  loading = signal(false);
  errorGlobal = signal('');
  submitting = signal(false);

  // --- LÓGICA DE CLIENTES ---
  clientes = signal<ClienteResponse[]>([]);
  modoNuevoCliente = signal(false);
  clienteSeleccionado = signal<ClienteResponse | null>(null);
  formCliente = signal<ClienteRequest>({ nombreCompleto: '', documentoIdentidad: '', telefono: '', email: '', direccion: '' });

  // --- LÓGICA DE PRODUCTOS Y CARRITO ---
  productos = signal<Producto[]>([]);
  busquedaProducto = signal('');
  carrito = signal<ItemCarrito[]>([]);
  tipoComprobante = signal('BOLETA'); 


  productosFiltrados = computed(() => {
    const term = this.busquedaProducto().toLowerCase().trim();
    if (!term) return [];
    return this.productos().filter(p => 
      p.nombre.toLowerCase().includes(term) || (p.codigoBarras && p.codigoBarras.includes(term))
    ).slice(0, 5); 
  });

  totalVenta = computed(() => this.carrito().reduce((acc, item) => acc + item.subtotal, 0));

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetearFormulario();
      }
    });
  }

  ngOnInit() {
    this.cargarCatalogos();
  }
  // --- NUEVAS VARIABLES DE CRÉDITO ---
  condicionPago = signal<'CONTADO' | 'CREDITO'>('CONTADO');
  diasCredito = signal<number>(15);
  pagoInicial = signal<number>(0);
  metodoPagoInicial = signal<string>('EFECTIVO');
  
  // 👇 NUEVO: Señal para el IGV
  igvSeleccionado = signal<number>(18); // 18% por defecto
  cargarCatalogos() {
    this.clienteService.obtenerClientes().subscribe(data => this.clientes.set(data));
    this.productoService.obtenerProductos().subscribe(data => this.productos.set(data));
  }

  agregarAlCarrito(prod: Producto) {
    this.carrito.update(items => {
      const existe = items.find(i => i.producto.id === prod.id);
      if (existe) {
        if (existe.cantidad < prod.stockDisponible) {
          existe.cantidad++;
          existe.subtotal = existe.cantidad * prod.precioVenta;
        } else {
          this.errorGlobal.set(`No hay más stock disponible para ${prod.nombre}`);
        }
        return [...items];
      } else {
        return [...items, { producto: prod, cantidad: 1, subtotal: prod.precioVenta }];
      }
    });
    this.busquedaProducto.set(''); 
    this.errorGlobal.set('');
  }

  actualizarCantidad(index: number, nuevaCantidad: number) {
    this.carrito.update(items => {
      const arr = [...items];
      const prod = arr[index].producto;
      
      if (nuevaCantidad > prod.stockDisponible) {
        this.errorGlobal.set(`El stock máximo de ${prod.nombre} es ${prod.stockDisponible}`);
        arr[index].cantidad = prod.stockDisponible;
      } else if (nuevaCantidad < 1) {
        arr[index].cantidad = 1;
      } else {
        arr[index].cantidad = nuevaCantidad;
        this.errorGlobal.set('');
      }
      
      arr[index].subtotal = arr[index].cantidad * prod.precioVenta;
      return arr;
    });
  }

  removerDelCarrito(index: number) {
    this.carrito.update(items => items.filter((_, i) => i !== index));
  }

  procesarVenta() {
    if (this.carrito().length === 0) {
      this.errorGlobal.set('El carrito está vacío.');
      return;
    }

    // VALIDACIÓN DE CRÉDITO
    if (this.condicionPago() === 'CREDITO' && !this.modoNuevoCliente() && !this.clienteSeleccionado()) {
      this.errorGlobal.set('Para ventas a crédito, debe seleccionar o crear un cliente obligatoriamente.');
      return;
    }

    if (this.condicionPago() === 'CREDITO' && this.pagoInicial() > this.totalVenta()) {
      this.errorGlobal.set('El adelanto no puede ser mayor al total de la venta.');
      return;
    }

    this.submitting.set(true);

    if (this.modoNuevoCliente()) {
      this.clienteService.crearCliente(this.formCliente()).subscribe({
        next: (nuevoCliente) => this.ejecutarVenta(nuevoCliente.id),
        error: (err) => {
          this.errorGlobal.set('Error al crear el cliente.');
          this.submitting.set(false);
        }
      });
    } else {
      this.ejecutarVenta(this.clienteSeleccionado() ? this.clienteSeleccionado()!.id : null);
    }
  }

  private ejecutarVenta(clienteId: number | null) {
    const payload: VentaRequest = {
      clienteId: clienteId,
      tipoComprobante: this.tipoComprobante(),
      
      condicionPago: this.condicionPago(),
      diasCredito: this.condicionPago() === 'CREDITO' ? this.diasCredito() : null,
      pagoInicial: this.condicionPago() === 'CREDITO' ? this.pagoInicial() : null,
      metodoPagoInicial: this.condicionPago() === 'CREDITO' ? this.metodoPagoInicial() : null,

      // 👇 ENVIAMOS EL IGV SELECCIONADO
      igvPorcentaje: this.igvSeleccionado(),

      detalles: this.carrito().map(item => ({
        productoId: item.producto.id,
        cantidad: item.cantidad
      }))
    };

    this.ventaService.registrarVenta(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.onGuardadoExitoso.emit();
        this.cerrar();
      },
      error: (err) => {
        this.errorGlobal.set(err.error?.message || 'Error al registrar la venta. Verifique los datos.');
        this.submitting.set(false);
      }
    });
  }

  resetearFormulario() {
    this.carrito.set([]);
    this.busquedaProducto.set('');
    this.clienteSeleccionado.set(null);
    this.modoNuevoCliente.set(false);
    this.formCliente.set({ nombreCompleto: '', documentoIdentidad: '', telefono: '', email: '', direccion: '' });
    this.errorGlobal.set('');
    
    // Resetear variables de crédito
    this.condicionPago.set('CONTADO');
    this.diasCredito.set(15);
    this.pagoInicial.set(0);
    this.metodoPagoInicial.set('EFECTIVO');
    this.igvSeleccionado.set(18);
  }

  cerrar() {
    this.onCerrar.emit();
  }
}