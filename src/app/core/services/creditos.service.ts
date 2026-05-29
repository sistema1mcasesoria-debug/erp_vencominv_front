// src/app/core/services/creditos.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private baseUrl = 'http://localhost:8080/api/v1/creditos';

  // 1. Obtener todas las deudas
  obtenerDeudasPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pendientes`);
  }

  // 2. Registrar un pago
  registrarAbono(abono: AbonoRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/abonos`, abono);
  }

  // 3. Ver historial de una venta específica
  obtenerHistorial(ventaId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ventas/${ventaId}/abonos`);
  }
}