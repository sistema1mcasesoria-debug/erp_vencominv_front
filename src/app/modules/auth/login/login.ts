import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { Empresa } from '../../../core/models/empresa.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
})
export class LoginComponent implements OnInit {
  private authService    = inject(AuthService);
  private empresaService = inject(EmpresaService);
  private router         = inject(Router);

  step = signal<'empresa' | 'login'>('empresa');
  
  empresas = signal<Empresa[]>([]);
  loadingEmpresas = signal(false);
  selectedEmpresa = signal<Empresa | null>(null);

  username = signal('');
  password = signal('');
  loading  = signal(false);
  error    = signal('');

  ngOnInit() {
    this.cargarEmpresas();
  }

  cargarEmpresas() {
    this.loadingEmpresas.set(true);
    this.error.set('');
    
    this.empresaService.obtenerEmpresas().subscribe({
      next: (data) => {
        this.empresas.set(data);
        this.loadingEmpresas.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las empresas disponibles.');
        this.loadingEmpresas.set(false);
      }
    });
  }

  seleccionarEmpresa(empresa: Empresa) {
    this.selectedEmpresa.set(empresa);
    this.error.set('');
    this.step.set('login');
  }

  cambiarEmpresa() {
    this.step.set('empresa');
    this.password.set('');
    this.error.set('');
  }

  onSubmit() {
    const empresaId = this.selectedEmpresa()?.id;
    if (!this.username() || !this.password() || !empresaId) return;
    
    this.loading.set(true);
    this.error.set('');

    const payload = {
      username: this.username(),
      password: this.password(),
      empresaId: empresaId
    };

    this.authService.login(payload).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error.set('Usuario o contraseña incorrectos.');
        this.loading.set(false);
      },
    });
  }
}