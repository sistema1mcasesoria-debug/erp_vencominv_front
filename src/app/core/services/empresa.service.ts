import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Empresa } from '../models/empresa.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/empresas`;

  obtenerEmpresas(): Observable<Empresa[]> {
    return this.http.get<Empresa[]>(this.apiUrl);
  }

  subirLogo(id: number, formData: FormData): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.apiUrl}/${id}/logo`, formData);
  }

  actualizarIgv(id: number, porcentaje: number): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.apiUrl}/${id}/igv?porcentaje=${porcentaje}`, {});
  }
}