import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  
  private baseUrl = `${environment.apiUrl}/reportes`;

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