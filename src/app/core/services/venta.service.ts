import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VentaRequest, VentaResponse } from '../models/venta.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/ventas`;

  registrarVenta(request: VentaRequest): Observable<any> {
    return this.http.post(this.baseUrl, request, { responseType: 'text' });
  }

  obtenerVentas(): Observable<VentaResponse[]> {
    return this.http.get<VentaResponse[]>(this.baseUrl);
  }
}