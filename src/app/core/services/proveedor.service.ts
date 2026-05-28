// src/app/core/services/proveedor.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor, ProveedorRequest } from '../models/proveedor.model';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/proveedores';

  obtenerProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.baseUrl}/activos`);
  }

  crearProveedor(proveedor: ProveedorRequest): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.baseUrl, proveedor);
  }

  actualizarProveedor(id: number, proveedor: ProveedorRequest): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.baseUrl}/${id}`, proveedor);
  }

  consultarRucSunat(ruc: string): Observable<any> {
    // Ahora llamas a TU backend, no a la API externa
    return this.http.get(`http://localhost:8080/api/v1/sunat/ruc/${ruc}`);
    }
}