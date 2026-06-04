import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompraRequest, CompraResponse, PagoProveedorRequest } from '../models/compra.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private http = inject(HttpClient);
  
  private baseUrl = `${environment.apiUrl}/compras`;

  registrarCompra(request: CompraRequest): Observable<string> {
    return this.http.post(this.baseUrl, request, { responseType: 'text' });
  }

  obtenerCompras(): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(this.baseUrl);
  }
  
  obtenerCuentasPorPagar(): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(`${this.baseUrl}/pendientes`);
  }

  registrarPagoProveedor(pago: PagoProveedorRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/pagos`, pago);
  }
}