import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

// ── Interfaces ─────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface CurrentUser {
  id: number;
  empresaId: number;
  empresaNombre: string;
  username: string;
  nombreCompleto: string;
  rol: 'ADMINISTRADOR' | 'CAJERO' | 'ALMACENERO' | 'EMBALADOR';
  fotoUrl?: string;
  logoUrl?: string; // 👈 1. Añadido aquí
  igvPorcentaje?: number;
}

// ── Helpers JWT ────────────────────────────────────────────
function decodeJwt(token: string): CurrentUser | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return {
      id:             decoded.id,
      empresaId:      decoded.empresa_id,
      empresaNombre:  decoded.empresa_nombre ?? '',
      username:       decoded.username,
      nombreCompleto: decoded.nombre_completo ?? decoded.username,
      rol:            decoded.rol,
      fotoUrl:        decoded.foto_url ?? '',
      logoUrl:        decoded.logo_url ?? '',
      // 👇 AÑADE ESTA LÍNEA (manejando ambos formatos por si acaso)
      igvPorcentaje:  decoded.igvPorcentaje ?? decoded.igv_porcentaje ?? 18, 
    };
  } catch {
    return null;
  }
}

// ── Service ────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'erp_token';

  currentUser = signal<CurrentUser | null>(this.loadUserFromStorage());

  isLoggedIn  = computed(() => this.currentUser() !== null);
  empresaId   = computed(() => this.currentUser()?.empresaId ?? null);

  updateCurrentUserState(datosActualizados: { nombreCompleto?: string, fotoUrl?: string, logoUrl?: string, igvPorcentaje?: number }) {
    const usuarioActual = this.currentUser();
    if (usuarioActual) {
      this.currentUser.set({
        ...usuarioActual,
        nombreCompleto: datosActualizados.nombreCompleto ?? usuarioActual.nombreCompleto,
        fotoUrl: datosActualizados.fotoUrl ?? usuarioActual.fotoUrl,
        logoUrl: datosActualizados.logoUrl ?? usuarioActual.logoUrl,
        // 👇 2. Asigna el nuevo valor aquí
        igvPorcentaje: datosActualizados.igvPorcentaje ?? usuarioActual.igvPorcentaje
      });
    }
  }

  // ── Login ──────────────────────────────────────────────
  login(credentials: LoginRequest) {
    return this.http
      .post<LoginResponse>('http://localhost:8080/api/v1/auth/login', credentials)
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.currentUser.set(decodeJwt(res.token));
        })
      );
  }

  // ── Logout ─────────────────────────────────────────────
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  // ── Token ──────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUserFromStorage(): CurrentUser | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token ? decodeJwt(token) : null;
  }
}