import { Component, OnInit, signal, computed, inject, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../../core/services/cliente.service';
import { ProductoService } from '../../../core/services/producto.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { ClienteResponse, ClienteRequest } from '../../../core/models/cliente.model';
import { Producto } from '../../../core/models/producto.model';
import { PedidoRequest } from '../../../core/models/pedido.model';

interface ItemPedido {
  producto: Producto;
  cantidad: number;
  precioAcordado: number;
  subtotal: number;
}

@Component({
  selector: 'app-nuevo-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo-pedido.html'
})
export class NuevoPedido implements OnInit {
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private pedidoService = inject(PedidoService);

  isOpen = input<boolean>(false);
  onCerrar = output<void>();
  onGuardadoExitoso = output<void>();

  loading = signal(false);
  submitting = signal(false);
  errorGlobal = signal('');

  // Catalogos
  clientes = signal<ClienteResponse[]>([]);
  productos = signal<Producto[]>([]);
  embaladores = signal<any[]>([]); 

  // --- LÓGICA DE CLIENTES ---
  modoNuevoCliente = signal(false);
  clienteSeleccionado = signal<number | null>(null);
  formCliente = signal<ClienteRequest>({ nombreCompleto: '', documentoIdentidad: '', telefono: '', email: '', direccion: '' });

  // --- LÓGICA DE PEDIDOS Y CARRITO ---
  requiereEmbalador = signal(false);
  embaladorSeleccionado = signal<number | null>(null);
  busquedaProducto = signal('');
  carrito = signal<ItemPedido[]>([]);
  vendedorId = signal<number>(0);

  // Variables base enviadas por defecto si no se usan
  condicionPago = signal<'CONTADO' | 'CREDITO'>('CONTADO');
  diasCredito = signal<number>(15);
  pagoInicial = signal<number>(0);
  metodoPagoInicial = signal<string>('EFECTIVO');
  
  // 👇 SEÑAL DEL IGV PARA EL FORMULARIO
  igvSeleccionado = signal<number>(18);

  productosFiltrados = computed(() => {
    const term = this.busquedaProducto().toLowerCase().trim();
    if (!term) return [];
    return this.productos().filter(p => p.nombre.toLowerCase().includes(term) || (p.codigoBarras && p.codigoBarras.includes(term))).slice(0, 5);
  });

  totalPedido = computed(() => this.carrito().reduce((acc, item) => acc + item.subtotal, 0));

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.resetearFormulario();
        this.extraerVendedorDelToken();
      }
    });
  }

  ngOnInit() {
    this.clienteService.obtenerClientes().subscribe(data => this.clientes.set(data));
    this.productoService.obtenerProductos().subscribe(data => this.productos.set(data));
    this.embaladores.set([{ id: 5, nombre: 'Juan Pérez (Almacén)' }]);
  }

  extraerVendedorDelToken() {
    try {
      const token = localStorage.getItem('erp_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.vendedorId.set(payload.usuario_id);
      }
    } catch (e) { 
      console.error('Error al leer token'); 
    }
  }

  agregarAlCarrito(prod: Producto) {
    if (prod.stockDisponible <= 0) {
      this.errorGlobal.set(`El producto ${prod.nombre} está agotado.`);
      return;
    }

    this.carrito.update(items => {
      const existe = items.find(i => i.producto.id === prod.id);
      if (existe) {
        if (existe.cantidad < prod.stockDisponible) {
          existe.cantidad++;
          existe.subtotal = existe.cantidad * existe.precioAcordado;
          this.errorGlobal.set('');
        } else {
          this.errorGlobal.set(`Stock máximo alcanzado para ${prod.nombre}`);
        }
        return [...items];
      }
      this.errorGlobal.set('');
      return [...items, { producto: prod, cantidad: 1, precioAcordado: prod.precioVenta, subtotal: prod.precioVenta }];
    });
    this.busquedaProducto.set('');
  }

  actualizarFila(index: number, cantidad: number, precio: number) {
    this.carrito.update(items => {
      const arr = [...items];
      const prod = arr[index].producto;

      let nuevaCantidad = cantidad;
      if (nuevaCantidad > prod.stockDisponible) {
        this.errorGlobal.set(`El stock máximo de ${prod.nombre} es ${prod.stockDisponible}`);
        nuevaCantidad = prod.stockDisponible;
      } else if (nuevaCantidad < 1) {
        nuevaCantidad = 1;
        this.errorGlobal.set('');
      } else {
        this.errorGlobal.set('');
      }

      arr[index].cantidad = nuevaCantidad;
      arr[index].precioAcordado = precio < 0 ? 0 : precio;
      arr[index].subtotal = arr[index].cantidad * arr[index].precioAcordado;
      return arr;
    });
  }

  removerDelCarrito(index: number) {
    this.carrito.update(items => items.filter((_, i) => i !== index));
    this.errorGlobal.set('');
  }

  guardarPedido() {
    if (this.carrito().length === 0) {
      this.errorGlobal.set('Agrega al menos un producto al pedido.');
      return;
    }

    this.submitting.set(true);

    if (this.modoNuevoCliente()) {
      if (!this.formCliente().nombreCompleto || !this.formCliente().documentoIdentidad) {
        this.errorGlobal.set('Complete los campos obligatorios del nuevo cliente.');
        this.submitting.set(false);
        return;
      }

      this.clienteService.crearCliente(this.formCliente()).subscribe({
        next: (nuevoCliente) => this.ejecutarRegistroPedido(nuevoCliente.id),
        error: () => {
          this.errorGlobal.set('Error al registrar el nuevo cliente.');
          this.submitting.set(false);
        }
      });

    } else {
      if (!this.clienteSeleccionado()) {
        this.errorGlobal.set('Debes seleccionar un cliente.');
        this.submitting.set(false);
        return;
      }
      this.ejecutarRegistroPedido(this.clienteSeleccionado()!);
    }
  }

  private ejecutarRegistroPedido(clienteId: number) {
    const payload: PedidoRequest = {
      clienteId: clienteId,
      vendedorId: this.vendedorId(),
      embaladorId: this.requiereEmbalador() ? this.embaladorSeleccionado() : null,
      
      // 👇 SE ENVÍA EL IGV SELECCIONADO
      igvPorcentaje: this.igvSeleccionado(),
      
      // Se envían datos por defecto para evitar errores en el backend
      condicionPago: this.condicionPago(),
      diasCredito: this.diasCredito(),
      pagoInicial: this.pagoInicial(),
      metodoPagoInicial: this.metodoPagoInicial(),

      detalles: this.carrito().map(item => ({
        productoId: item.producto.id,
        cantidad: item.cantidad,
        precioAcordado: item.precioAcordado
      }))
    };

    this.pedidoService.crearPedido(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.onGuardadoExitoso.emit();
        this.cerrar();
      },
      error: () => {
        this.errorGlobal.set('Error al registrar el pedido.');
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
    this.requiereEmbalador.set(false);
    this.embaladorSeleccionado.set(null);
    this.errorGlobal.set('');
    // 👇 ASEGURARNOS DE RESETEAR EL IGV A 18%
    this.igvSeleccionado.set(18);
  }

  cerrar() {
    this.onCerrar.emit();
  }
}