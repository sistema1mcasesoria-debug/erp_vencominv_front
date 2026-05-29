export interface CompraDetalleRequest {
  productoId: number;
  codigoLote: string;
  cantidad: number;
  costoUnitario: number;
  fechaVencimiento: string;
}

export interface CompraRequest {
  proveedorId: number;
  comprobante: string;
  
  // --- NUEVOS CAMPOS ---
  condicionPago?: 'CONTADO' | 'CREDITO';
  diasCredito?: number | null;
  pagoInicial?: number | null;
  metodoPagoInicial?: string | null;

  detalles: CompraDetalleRequest[];
}

// ... (LoteResponse se queda igual)

export interface CompraResponse {
  id: number;
  empresaId: number;
  proveedorId: number;
  proveedorRazonSocial: string;
  usuarioId: number;
  usuarioNombre: string;
  fechaCompra: string;
  comprobante: string;
  total: number;
  estado: string;
  
  // --- NUEVOS CAMPOS ---
  condicionPago: string;
  estadoPago: string;
  fechaVencimiento: string | null;
  saldoPendiente: number;

  lotes: LoteResponse[];
}

// --- NUEVA INTERFAZ PARA PAGOS ---
export interface PagoProveedorRequest {
  compraId: number;
  monto: number;
  metodoPago: string;
  referencia?: string;
}


export interface LoteResponse {
  id: number;
  productoId: number;
  productoNombre: string;
  compraId: number;
  codigoLote: string;
  fechaFabricacion: string;
  fechaVencimiento: string;
  costoUnitario: number;
  cantidadInicial: number;
  cantidadActual: number;
  estado: string;
}
