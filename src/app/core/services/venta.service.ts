// src/app/core/services/venta.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VentaRequest, VentaResponse } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/ventas';

  registrarVenta(request: VentaRequest): Observable<any> {
    return this.http.post(this.baseUrl, request, { responseType: 'text' }); // 'text' porque suele devolver un String de éxito
  }
  // En src/app/core/services/venta.service.ts (Agrega este método)
  obtenerVentas(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(this.baseUrl);
  }
}