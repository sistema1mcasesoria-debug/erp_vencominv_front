import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoteResponse } from '../models/compra.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoteService {
  private http = inject(HttpClient);
  
  private baseUrl = `${environment.apiUrl}/lotes`;

  obtenerLotesActivos(): Observable<LoteResponse[]> {
    return this.http.get<LoteResponse[]>(this.baseUrl);
  }
}