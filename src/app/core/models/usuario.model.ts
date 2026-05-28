export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  rolId: number;
  rolNombre?: string;
  estado: boolean;
}

export interface UsuarioRequest {
  username: string;
  password?: string;
  nombreCompleto: string;
  rolId: number;
}