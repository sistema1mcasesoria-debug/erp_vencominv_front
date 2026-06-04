// src/app/core/services/reportes.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/reportes';

  // 1. Mantiene la descarga de EXCEL
  descargarExcel(tipo: string, inicio: string, fin: string, productoId?: number | string): Observable<Blob> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fin) params = params.set('fin', fin);
    if (productoId && productoId !== 'TODOS') params = params.set('productoId', productoId.toString());

    return this.http.get(`${this.baseUrl}/${tipo}/excel`, {
      params: params,
      responseType: 'blob' 
    });
  }

  // 2. NUEVO: Llama al backend para obtener el PDF
  descargarPdf(tipo: string, inicio: string, fin: string, productoId?: number | string): Observable<Blob> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fin) params = params.set('fin', fin);
    if (productoId && productoId !== 'TODOS') params = params.set('productoId', productoId.toString());

    return this.http.get(`${this.baseUrl}/${tipo}/pdf`, {
      params: params,
      responseType: 'blob' 
    });
  }
}