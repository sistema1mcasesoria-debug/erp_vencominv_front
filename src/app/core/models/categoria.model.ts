export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
}

export interface CategoriaRequest {
  nombre: string;
  descripcion: string;
}