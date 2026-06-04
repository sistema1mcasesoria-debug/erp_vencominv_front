export interface Kpis {
  ventasDelMes: number;
  comprasDelMes: number;
  porCobrar: number;
  porPagar: number;
}

export interface ProductoStock {
  id: number;
  nombre: string;
  stockFisico: number;
}

export interface Alertas {
  pedidosPendientes: number;
  stockCritico: ProductoStock[];
}

export interface GraficoVentas {
  fecha: string;
  ingresos: number;
  egresos: number;
}

export interface VentaReciente {
  id: number;
  comprobante: string;
  cliente: string;
  total: number;
  fecha: string;
}

export interface Vencimiento {
  tipo: 'COBRAR' | 'PAGAR';
  comprobante: string;
  entidad: string;
  monto: number;
  fechaVencimiento: string;
}

export interface DashboardResponse {
  kpis: Kpis;
  alertas: Alertas;
  graficoSieteDias: GraficoVentas[];
  ventasRecientes: VentaReciente[];
  proximosVencimientos: Vencimiento[];
}