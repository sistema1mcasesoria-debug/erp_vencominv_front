// src/app/core/services/kardex.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { KardexResponse, KardexAjusteRequest } from '../models/kardex.model';

@Injectable({ providedIn: 'root' })
export class KardexService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/kardex';

  historialPorProducto(productoId: number): Observable<KardexResponse[]> {
    return this.http.get<KardexResponse[]>(`${this.baseUrl}/producto/${productoId}`);
  }

  registrarAjuste(request: KardexAjusteRequest): Observable<KardexResponse> {
    return this.http.post<KardexResponse>(`${this.baseUrl}/ajuste`, request);
  }
}