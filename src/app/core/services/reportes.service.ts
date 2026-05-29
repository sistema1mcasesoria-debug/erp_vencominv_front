// src/app/core/services/reportes.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/reportes';

  descargarExcel(tipo: string, inicio: string, fin: string): Observable<Blob> {
    let params = new HttpParams();
    
    // Solo agregamos las fechas a la URL si el usuario las seleccionó
    if (inicio) params = params.set('inicio', inicio);
    if (fin) params = params.set('fin', fin);

    // Llamamos a: /api/v1/reportes/{tipo}/excel?inicio=...&fin=...
    return this.http.get(`${this.baseUrl}/${tipo}/excel`, {
      params: params,
      responseType: 'blob' // 🔥 VITAL: Le dice a Angular que es un archivo, no un JSON
    });
  }
}