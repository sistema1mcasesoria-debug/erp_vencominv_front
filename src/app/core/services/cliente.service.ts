import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClienteRequest, ClienteResponse } from '../models/cliente.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  
  private baseUrl = `${environment.apiUrl}/clientes`;

  obtenerClientes(): Observable<ClienteResponse[]> {
    return this.http.get<ClienteResponse[]>(this.baseUrl);
  }

  crearCliente(cliente: ClienteRequest): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(this.baseUrl, cliente);
  }

  actualizarCliente(id: number, cliente: ClienteRequest): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${this.baseUrl}/${id}`, cliente);
  }
}