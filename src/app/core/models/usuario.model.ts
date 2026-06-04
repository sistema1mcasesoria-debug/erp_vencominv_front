export interface Usuario {
  id: number;
  username: string;
  nombreCompleto: string;
  rolId: number;
  rolNombre?: string;
  estado: boolean;
  fotoUrl?: string;
}

export interface CurrentUser {
  id: number;
  empresaId: number;         
  empresaNombre: string;      
  username: string;
  nombreCompleto: string;
  rol: string;
  fotoUrl?: string;
  logoUrl?: string; 
}

export interface UsuarioRequest {
  username: string;
  password?: string;
  nombreCompleto: string;
  rolId: number;
}