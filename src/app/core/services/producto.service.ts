import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto, ProductoRequest } from '../models/producto.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  
  private baseUrl = `${environment.apiUrl}/productos`;

  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.baseUrl);
  }

  crearProducto(producto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(this.baseUrl, producto);
  }

  actualizarProducto(id: number, producto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${this.baseUrl}/${id}`, producto);
  }

  desactivarProducto(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/desactivar`, {});
  }
}