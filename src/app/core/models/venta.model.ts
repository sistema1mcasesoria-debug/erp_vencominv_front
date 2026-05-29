// src/app/core/models/venta.model.ts

export interface VentaDetalleRequest {
  productoId: number;
  cantidad: number;
}

export interface VentaRequest {
  clienteId: number | null;
  tipoComprobante: string; // 'FACTURA' o 'BOLETA'

  condicionPago?: 'CONTADO' | 'CREDITO';
  diasCredito?: number | null;
  pagoInicial?: number | null;
  metodoPagoInicial?: string | null;

  detalles: VentaDetalleRequest[];
}

// ── DETALLES QUE VIENEN DEL BACKEND (Mapeados del Lote) ──
export interface VentaDetalleResponse {
  id: number;
  loteId: number | null;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

// ── LA RESPUESTA MASTER FIEL A TU DTO EN JAVA ──
export interface VentaResponse {
  id: number;
  empresaId: number;
  clienteId: number;
  clienteNombre: string;
  clienteDocumento:String;
  usuarioId: number;
  usuarioNombre: string;   // Tu cajero de confianza
  fechaVenta: string;      // LocalDateTime se recibe como String ISO
  comprobante: string;     // Ej: "B001-000021"
  tipoComprobante: string; // "BOLETA" o "FACTURA"
  subtotalSinImpuesto: number;
  impuestoTotal: number;
  total: number;
  estado: string;          // ENUM mapeado a String
  detalle: VentaDetalleResponse[]; // Tu sub-lista interna de artículos
  condicionPago: string;
  estadoPago: string;
}