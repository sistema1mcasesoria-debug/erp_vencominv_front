import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompraRequest, CompraResponse } from '../models/compra.model';

@Injectable({
  providedIn: 'root'
})
export class CompraService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/compras';

  registrarCompra(request: CompraRequest): Observable<string> {
    return this.http.post(this.baseUrl, request, { responseType: 'text' });
  }

  obtenerCompras(): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(this.baseUrl);
  }
}