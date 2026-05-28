// src/app/core/models/unidad-medida.model.ts
export interface UnidadMedida {
  id: number;
  empresaId: number;
  nombre: string;
  abreviatura: string;
  permiteFraccion: boolean;
}

export interface UnidadMedidaRequest {
  nombre: string;
  abreviatura: string;
  permiteFraccion: boolean;
}