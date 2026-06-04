import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, UsuarioRequest } from '../models/usuario.model';
import { Rol } from '../models/rol.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  
  private baseUrl = environment.apiUrl;

  obtenerUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/usuarios`);
  }

  crearUsuario(usuario: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/usuarios`, usuario);
  }

  actualizarUsuario(id: number, usuario: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/usuarios/${id}`, usuario);
  }

  desactivarUsuario(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/usuarios/${id}/desactivar`, {});
  }
  
  activarUsuario(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/usuarios/${id}/activar`, {});
  }

  obtenerRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.baseUrl}/roles`);
  }
  
  subirFotoPerfil(formData: FormData): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.baseUrl}/usuarios/perfil/foto`, formData);
  }

  actualizarMiPerfil(datos: { nombreCompleto: string, password?: string }): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.baseUrl}/usuarios/perfil`, datos);
  }
}