import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Proveedor, ProveedorRequest } from '../models/proveedor.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private http = inject(HttpClient);
  
  private baseUrl = `${environment.apiUrl}/proveedores`;

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
    return this.http.get(`${environment.apiUrl}/sunat/ruc/${ruc}`);
  }
}