// src/app/core/services/unidad-medida.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UnidadMedida, UnidadMedidaRequest } from '../models/unidad-medida.model';

@Injectable({
  providedIn: 'root'
})
export class UnidadMedidaService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/unidades-medida';

  obtenerUnidades(): Observable<UnidadMedida[]> {
    return this.http.get<UnidadMedida[]>(this.baseUrl);
  }

  crearUnidad(unidad: UnidadMedidaRequest): Observable<UnidadMedida> {
    return this.http.post<UnidadMedida>(this.baseUrl, unidad);
  }

  actualizarUnidad(id: number, unidad: UnidadMedidaRequest): Observable<UnidadMedida> {
    return this.http.put<UnidadMedida>(`${this.baseUrl}/${id}`, unidad);
  }
}