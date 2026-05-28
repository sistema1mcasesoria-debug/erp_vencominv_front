// src/app/core/models/proveedor.model.ts
export interface Proveedor {
  id: number;
  razonSocial: string;
  documentoIdentidad: string;
  telefono: string;
  email: string;
}

export interface ProveedorRequest {
  razonSocial: string;
  documentoIdentidad: string;
  telefono: string;
  email: string;
}