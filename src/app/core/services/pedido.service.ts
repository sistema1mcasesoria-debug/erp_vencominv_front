// src/app/core/services/pedido.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PedidoRequest, PedidoResponse } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/pedidos';

  obtenerPedidos(): Observable<PedidoResponse[]> {
    return this.http.get<PedidoResponse[]>(this.baseUrl);
  }

  crearPedido(pedido: PedidoRequest): Observable<any> {
    return this.http.post(this.baseUrl, pedido, { responseType: 'text' });
  }

  actualizarEstado(id: number, estado: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/estado?estado=${estado}`, {}, { responseType: 'text' });
  }
  obtenerPedidoPorId(id: number): Observable<PedidoResponse> {
    return this.http.get<PedidoResponse>(`${this.baseUrl}/${id}`);
  }
}