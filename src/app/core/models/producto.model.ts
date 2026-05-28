export interface Producto {
  id: number;
  codigoBarras: string;
  nombre: string;
  categoriaId: number;
  categoriaNombre: string;
  unidadMedidaId: number;
  unidadMedidaAbreviatura: string;
  precioVenta: number;
  stockFisico: number;     // <-- Asegurar estos campos que vienen de tu mapeador
  stockReservado: number;
  stockDisponible: number;
  estado: boolean;
}
export interface ProductoRequest {
  codigoBarras: string;
  nombre: string;
  categoriaId: number;
  unidadMedidaId: number;
  precioVenta: number;
}