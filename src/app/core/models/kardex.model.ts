// src/app/core/models/kardex.model.ts
export interface KardexResponse {
  id: number;
  fechaMovimiento: string;
  tipoMovimiento: string; // 'ENTRADA', 'SALIDA', 'AJUSTE'
  motivo: string;
  cantidad: number;
  saldoLote: number;
  loteId: number;
  codigoLote: string;
  productoId: number;
  nombreProducto: string;
}

export interface KardexAjusteRequest {
  loteId: number;
  cantidad: number; // Puede ser positivo (sobra stock) o negativo (falta stock)
  motivo: string;
}