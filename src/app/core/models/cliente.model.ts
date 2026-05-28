// src/app/core/models/cliente.model.ts
export interface ClienteRequest {
  nombreCompleto: string;
  documentoIdentidad: string;
  telefono: string;
  email: string;
  direccion: string;
}

export interface ClienteResponse extends ClienteRequest {
  id: number;
}