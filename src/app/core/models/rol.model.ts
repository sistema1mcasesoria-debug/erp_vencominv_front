export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  modulos: string[];
}