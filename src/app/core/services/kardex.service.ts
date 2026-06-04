import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KardexResponse, KardexAjusteRequest } from '../models/kardex.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KardexService {
  private http = inject(HttpClient);
  
  private baseUrl = `${environment.apiUrl}/kardex`;

  obtenerMovimientosGlobales(inicio: string, fin: string): Observable<KardexResponse[]> {
    let params = new HttpParams()
      .set('inicio', inicio)
      .set('fin', fin);
      
    return this.http.get<KardexResponse[]>(this.baseUrl, { params });
  }

  historialPorProducto(productoId: number): Observable<KardexResponse[]> {
    return this.http.get<KardexResponse[]>(`${this.baseUrl}/producto/${productoId}`);
  }

  registrarAjuste(request: KardexAjusteRequest): Observable<KardexResponse> {
    return this.http.post<KardexResponse>(`${this.baseUrl}/ajuste`, request);
  }
}