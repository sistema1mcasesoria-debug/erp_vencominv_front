import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from '../../../core/services/reportes.service';

@Component({
  selector: 'app-centro-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './centro-reportes.html',
  styleUrl: './centro-reportes.css',
})
export class CentroReportes {
  private reportesService = inject(ReportesService);

  fechaInicio: string = '';
  fechaFin: string = '';
  descargando: boolean = false;

  // --- NUEVO: Filtro de Categorías ---
  // Puede ser 'TODOS', 'VENTAS', 'COMPRAS', 'INVENTARIO'
  filtroActivo = signal<string>('TODOS'); 

  cambiarFiltro(categoria: string) {
    this.filtroActivo.set(categoria);
  }

  descargarReporte(tipo: string) {
    if (tipo === 'kardex' && (!this.fechaInicio || !this.fechaFin)) {
      alert('Para exportar la auditoría del Kardex, es obligatorio seleccionar una Fecha de Inicio y una Fecha Fin.');
      return;
    }

    this.descargando = true;

    this.reportesService.descargarExcel(tipo, this.fechaInicio, this.fechaFin).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const safeTipo = tipo.replace('/', '_').toUpperCase();
        const timestamp = new Date().toISOString().split('T')[0];
        a.download = `Reporte_${safeTipo}_${timestamp}.xlsx`;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.descargando = false;
      },
      error: (err) => {
        console.error('Error al descargar el reporte:', err);
        alert('Hubo un problema al generar el Excel. Verifica que el rango de fechas sea válido o que tengas datos.');
        this.descargando = false;
      }
    });
  }
}