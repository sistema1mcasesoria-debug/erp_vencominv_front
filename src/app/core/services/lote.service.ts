import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoteResponse } from '../models/compra.model';

@Injectable({
  providedIn: 'root'
})
export class LoteService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8080/api/v1/lotes';

  obtenerLotesActivos(): Observable<LoteResponse[]> {
    return this.http.get<LoteResponse[]>(this.baseUrl);
  }
}