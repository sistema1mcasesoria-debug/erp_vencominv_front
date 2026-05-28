// src/app/core/models/pedido.model.ts

export interface PedidoDetalleRequest {
  productoId: number;
  cantidad: number;
  precioAcordado: number;
}

export interface PedidoRequest {
  clienteId: number;
  vendedorId: number;
  embaladorId: number | null;
  detalles: PedidoDetalleRequest[];
}

export interface PedidoDetalleResponse {
  id: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioAcordado: number;
  subtotal: number;
}

export interface PedidoResponse {
  id: number;
  empresaId: number;
  clienteId: number;
  clienteNombre: string;
  vendedorId: number;
  vendedorNombre: string;
  embaladorId: number | null;
  embaladorNombre: string | null;
  fechaPedido: string;
  estado: string;
  detalle: PedidoDetalleResponse[]; // Arreglo que llega cuando pides por ID
}