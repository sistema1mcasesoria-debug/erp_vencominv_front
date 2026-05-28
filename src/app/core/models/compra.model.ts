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
  detalles: CompraDetalleRequest[];
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
  lotes: LoteResponse[];
}