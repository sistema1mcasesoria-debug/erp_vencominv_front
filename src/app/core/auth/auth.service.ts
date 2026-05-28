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
  empresaId: 1;
  empresaNombre: string;
  username: string;
  nombreCompleto: string;
  rol: 'ADMINISTRADOR' | 'CAJERO' | 'ALMACENERO' | 'EMBALADOR';
}

// ── Helpers JWT ────────────────────────────────────────────
function decodeJwt(token: string): CurrentUser | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return {
      id:            decoded.id,
      empresaId:     decoded.empresa_id,
      empresaNombre: decoded.empresa_nombre ?? '',
      username:      decoded.username,
      nombreCompleto: decoded.nombre_completo ?? decoded.username,
      rol:           decoded.rol,
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

  // Signal con el usuario actual — nunca es unknown
  currentUser = signal<CurrentUser | null>(this.loadUserFromStorage());

  isLoggedIn  = computed(() => this.currentUser() !== null);
  empresaId   = computed(() => this.currentUser()?.empresaId ?? null);

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

  // ── Inicializa desde localStorage al recargar ──────────
  private loadUserFromStorage(): CurrentUser | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return token ? decodeJwt(token) : null;
  }
}