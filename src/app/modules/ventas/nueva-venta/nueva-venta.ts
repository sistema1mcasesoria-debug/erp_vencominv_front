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

// Interfaz interna para el carrito
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

  // --- ESTADOS GLOBALES ---
  loading = signal(false);
  errorGlobal = signal('');
  submitting = signal(false);

  // --- LÓGICA DE CLIENTES ---
  clientes = signal<ClienteResponse[]>([]);
  modoNuevoCliente = signal(false);
  clienteSeleccionado = signal<ClienteResponse | null>(null);
  
  // Formulario Nuevo Cliente
  formCliente = signal<ClienteRequest>({ nombreCompleto: '', documentoIdentidad: '', telefono: '', email: '', direccion: '' });

  // --- LÓGICA DE PRODUCTOS Y CARRITO ---
  productos = signal<Producto[]>([]);
  busquedaProducto = signal('');
  carrito = signal<ItemCarrito[]>([]);
  tipoComprobante = signal('BOLETA'); // Por defecto

  // Autocomplete Productos (Filtra por nombre o barcode, MUESTRA TODOS incluyendo los agotados)
  productosFiltrados = computed(() => {
    const term = this.busquedaProducto().toLowerCase().trim();
    if (!term) return [];
    return this.productos().filter(p => 
      p.nombre.toLowerCase().includes(term) || (p.codigoBarras && p.codigoBarras.includes(term))
    ).slice(0, 5); // Mostrar máximo 5 resultados rápidos
  });

  // Totales
  totalVenta = computed(() => this.carrito().reduce((acc, item) => acc + item.subtotal, 0));

  constructor() {
    // Resetear form al abrir
    effect(() => {
      if (this.isOpen()) {
        this.resetearFormulario();
      }
    });
  }

  ngOnInit() {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.clienteService.obtenerClientes().subscribe(data => this.clientes.set(data));
    this.productoService.obtenerProductos().subscribe(data => this.productos.set(data));
  }

  // --- FUNCIONES DEL CARRITO ---
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
    this.busquedaProducto.set(''); // Limpiar buscador tras agregar
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

  // --- PROCESAR VENTA ---
  procesarVenta() {
    if (this.carrito().length === 0) {
      this.errorGlobal.set('El carrito está vacío.');
      return;
    }

    this.submitting.set(true);

    if (this.modoNuevoCliente()) {
      // 1. Crear cliente primero y luego vender
      this.clienteService.crearCliente(this.formCliente()).subscribe({
        next: (nuevoCliente) => this.ejecutarVenta(nuevoCliente.id),
        error: (err) => {
          this.errorGlobal.set('Error al crear el cliente.');
          this.submitting.set(false);
        }
      });
    } else {
      // 2. Vender con cliente existente
      if (!this.clienteSeleccionado()) {
        this.errorGlobal.set('Debe seleccionar un cliente.');
        this.submitting.set(false);
        return;
      }
      this.ejecutarVenta(this.clienteSeleccionado()!.id);
    }
  }

  private ejecutarVenta(clienteId: number) {
    const payload: VentaRequest = {
      clienteId: clienteId,
      tipoComprobante: this.tipoComprobante(),
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
        this.errorGlobal.set('Error al registrar la venta. Verifique los datos.');
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
  }

  cerrar() {
    this.onCerrar.emit();
  }
}