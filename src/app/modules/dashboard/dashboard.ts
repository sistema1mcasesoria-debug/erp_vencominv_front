import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardResponse } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);

  data = signal<DashboardResponse | null>(null);
  loading = signal(true);
  errorGlobal = signal('');

  // Configuración del gráfico de ApexCharts
  public chartOptions: Partial<ApexOptions> = {
    series: [],
    chart: { type: 'bar', height: 350, toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: { categories: [], labels: { style: { colors: '#9ca3af' } } },
    yaxis: { title: { text: 'Monto (S/)' }, labels: { style: { colors: '#9ca3af' } } },
    fill: { opacity: 1 },
    colors: ['#10b981', '#f43f5e'], // Verde para Ingresos, Rojo para Egresos
    tooltip: { y: { formatter: (val) => 'S/ ' + val.toFixed(2) } },
    legend: { labels: { colors: '#6b7280' } }
  };

  ngOnInit() {
    this.cargarDashboard();
  }

  cargarDashboard() {
    this.loading.set(true);
    this.dashboardService.obtenerDashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.armarGrafico(res.graficoSieteDias);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorGlobal.set('No se pudo cargar la información del Dashboard.');
        this.loading.set(false);
      }
    });
  }

  armarGrafico(graficoData: any[]) {
    // Extraemos fechas, ingresos y egresos de la lista
    const fechas = graficoData.map(g => this.formatearFechaCorta(g.fecha));
    const ingresos = graficoData.map(g => g.ingresos);
    const egresos = graficoData.map(g => g.egresos);

    this.chartOptions.series = [
      { name: 'Ventas (Ingresos)', data: ingresos },
      { name: 'Compras (Egresos)', data: egresos }
    ];
    this.chartOptions.xaxis = { ...this.chartOptions.xaxis, categories: fechas };
  }

  formatearFechaCorta(fechaString: string): string {
    const fecha = new Date(fechaString + 'T00:00:00'); // Evitar desfase de zona horaria
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return `${dias[fecha.getDay()]} ${fecha.getDate()}`;
  }
}