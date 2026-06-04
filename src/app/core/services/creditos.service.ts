// src/app/core/services/creditos.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// 👇 1. Importamos el environment
import { environment } from '../../../environments/environment';

export interface AbonoRequest {
  ventaId: number;
  monto: number;
  metodoPago: string;
  referencia?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreditosService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/creditos`;

  obtenerDeudasPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pendientes`);
  }

  registrarAbono(abono: AbonoRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/abonos`, abono);
  }

  obtenerHistorial(ventaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ventas/${ventaId}/abonos`);
  }
}