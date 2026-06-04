import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; // 👈 Importante para el Iframe
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
  private sanitizer = inject(DomSanitizer); // 👈 Inyectamos el Sanitizer

  fechaInicio: string = '';
  fechaFin: string = '';
  descargando: boolean = false;
  filtroActivo = signal<string>('TODOS'); 

  // Estado del Visor PDF
  viewerAbierto = signal<boolean>(false);
  tituloDocumento = signal<string>('');
  pdfUrlSegura = signal<SafeResourceUrl | null>(null); // 👈 URL que Angular permite mostrar

  cambiarFiltro(categoria: string) {
    this.filtroActivo.set(categoria);
  }

  // 👇 FUNCIÓN 1: Abre el visor PDF nativo
  verDocumentoPdf(tipo: string, titulo: string) {
    if (tipo === 'kardex' && (!this.fechaInicio || !this.fechaFin)) {
      alert('Para ver la auditoría, debes seleccionar fechas.');
      return;
    }

    this.descargando = true;
    this.tituloDocumento.set(titulo);

    this.reportesService.descargarPdf(tipo, this.fechaInicio, this.fechaFin).subscribe({
      next: (blob) => {
        // Convierte el Blob a una URL temporal en la RAM
        const objectUrl = window.URL.createObjectURL(blob);
        // Le dice a Angular que es seguro poner esta URL en un iframe
        this.pdfUrlSegura.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
        
        this.viewerAbierto.set(true);
        this.descargando = false;
      },
      error: (err) => {
        console.error('Error al cargar el PDF:', err);
        alert('Error al generar el PDF. Revisa tu consola.');
        this.descargando = false;
      }
    });
  }

  // 👇 FUNCIÓN 2: Descarga el Excel directo (Como lo tenías originalmente)
  descargarExcelDirecto(tipo: string) {
    if (tipo === 'kardex' && (!this.fechaInicio || !this.fechaFin)) {
      alert('Para exportar, debes seleccionar fechas.');
      return;
    }

    this.descargando = true;

    this.reportesService.descargarExcel(tipo, this.fechaInicio, this.fechaFin).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTipo = tipo.replace('/', '_').toUpperCase();
        a.download = `Reporte_${safeTipo}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.descargando = false;
      },
      error: (err) => {
        console.error('Error al descargar el Excel:', err);
        this.descargando = false;
      }
    });
  }

  cerrarVisor() {
    this.viewerAbierto.set(false);
    this.pdfUrlSegura.set(null);
  }
}