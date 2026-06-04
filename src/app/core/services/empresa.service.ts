// src/app/core/services/empresa.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empresa } from '../models/empresa.model';

@Injectable({
  providedIn: 'root'
})

export class EmpresaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/empresas';

  obtenerEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.apiUrl);
  }
  subirLogo(id: number, formData: FormData): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.apiUrl}/${id}/logo`, formData);
  }
  actualizarIgv(id: number, porcentaje: number): Observable<Empresa> {
    // Como enviamos por @RequestParam, usamos HttpParams o en la URL
    return this.http.patch<Empresa>(`${this.apiUrl}/${id}/igv?porcentaje=${porcentaje}`, {});
  }
}