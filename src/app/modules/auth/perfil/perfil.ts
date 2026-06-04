import {
  Component, signal, computed, inject, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { EmpresaService } from '../../../core/services/empresa.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private fb            = inject(FormBuilder);
  private authService   = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private empresaService = inject(EmpresaService);

  // ── Estado ──────────────────────────────────────────────────────────
  activeTab         = signal<'perfil' | 'empresa'>('perfil');
  guardandoPerfil   = signal(false);
  guardandoLogo     = signal(false);
  guardandoEmpresa  = signal(false);

  mensajePerfil     = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  mensajeEmpresa    = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  fotoPreview       = signal<string | null>(null);
  logoPreview       = signal<string | null>(null);
  archivoFoto       = signal<File | null>(null);
  archivoLogo       = signal<File | null>(null);

  guardandoIgv = signal(false);
  igvValor = signal<number>(18);

  // ── Usuario actual ───────────────────────────────────────────────────
  usuario   = computed(() => this.authService.currentUser());
  esAdmin   = computed(() => this.usuario()?.rol === 'ADMINISTRADOR');
  avatarLetra = computed(() => (this.usuario()?.nombreCompleto ?? 'U').charAt(0).toUpperCase());
  fotoActual  = computed(() => this.fotoPreview() ?? this.usuario()?.fotoUrl ?? null);
  logoActual  = computed(() => this.logoPreview() ?? this.usuario()?.logoUrl ?? null);
  // ── Formularios ──────────────────────────────────────────────────────
  formPerfil = this.fb.group({
    nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
    passwordActual: [''],
    passwordNuevo:  ['', [Validators.minLength(6)]],
    passwordConfirm:[''],
  });

  ngOnInit() {
    this.formPerfil.patchValue({
      nombreCompleto: this.usuario()?.nombreCompleto ?? '',
    });
    // Si tienes el igv en el authService/currentUser
    this.igvValor.set(this.usuario()?.igvPorcentaje ?? 18);
  }

  // ── Tabs ─────────────────────────────────────────────────────────────
  setTab(tab: 'perfil' | 'empresa') {
    this.activeTab.set(tab);
    this.mensajePerfil.set(null);
    this.mensajeEmpresa.set(null);
  }

  // ── Foto de perfil ───────────────────────────────────────────────────
  onFotoSeleccionada(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.mensajePerfil.set({ tipo: 'error', texto: 'La imagen no puede superar 2 MB.' });
      return;
    }
    this.archivoFoto.set(file);
    const reader = new FileReader();
    reader.onload = e => this.fotoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }
  guardarIgv(nuevoValor: string) {
    const porcentaje = parseFloat(nuevoValor);
    if (isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      this.mensajeEmpresa.set({ tipo: 'error', texto: 'Porcentaje inválido.' });
      return;
    }

    this.guardandoIgv.set(true);
    const empresaId = this.usuario()?.empresaId;

    this.empresaService.actualizarIgv(empresaId!, porcentaje).subscribe({
      next: (empresaActualizada: any) => {
        this.mensajeEmpresa.set({ tipo: 'ok', texto: 'Porcentaje de IGV actualizado.' });
        this.guardandoIgv.set(false);
        this.igvValor.set(empresaActualizada.igvPorcentaje);
        
        // Opcional: Actualizar el currentUser state si guardas el IGV ahí
        this.authService.updateCurrentUserState({ igvPorcentaje: empresaActualizada.igvPorcentaje });
      },
      error: () => {
        this.mensajeEmpresa.set({ tipo: 'error', texto: 'Error al actualizar el IGV.' });
        this.guardandoIgv.set(false);
      }
    });
  }
  guardarFoto() {
    const archivo = this.archivoFoto();
    if (!archivo) return;
    this.guardandoPerfil.set(true);
    const form = new FormData();
    form.append('archivo', archivo);
    
    this.usuarioService.subirFotoPerfil(form).subscribe({
      next: (usuarioActualizado) => { 
        this.mensajePerfil.set({ tipo: 'ok', texto: 'Foto actualizada correctamente.' });
        this.archivoFoto.set(null);
        this.guardandoPerfil.set(false);
        
        this.authService.updateCurrentUserState({ fotoUrl: usuarioActualizado.fotoUrl });
      },
      error: () => {
        this.mensajePerfil.set({ tipo: 'error', texto: 'Error al subir la foto. Intenta de nuevo.' });
        this.guardandoPerfil.set(false);
      },
    });
  }

  guardarPerfil() {
    if (this.formPerfil.invalid) return;
    
    const { nombreCompleto, passwordNuevo, passwordConfirm } = this.formPerfil.value;
    
    if (passwordNuevo && passwordNuevo !== passwordConfirm) {
      this.mensajePerfil.set({ tipo: 'error', texto: 'Las contraseñas no coinciden.' });
      return;
    }
    
    this.guardandoPerfil.set(true);

    const payload = {
      nombreCompleto: nombreCompleto!,
      password: passwordNuevo ? passwordNuevo : undefined
    };

    this.usuarioService.actualizarMiPerfil(payload).subscribe({
      next: (usuarioActualizado) => {
        this.mensajePerfil.set({ tipo: 'ok', texto: 'Perfil actualizado correctamente.' });
        this.guardandoPerfil.set(false);
        this.formPerfil.patchValue({ passwordNuevo: '', passwordConfirm: '' });
        
        this.authService.updateCurrentUserState({ nombreCompleto: usuarioActualizado.nombreCompleto });
      },
      error: () => {
        this.mensajePerfil.set({ tipo: 'error', texto: 'Error al actualizar el perfil.' });
        this.guardandoPerfil.set(false);
      }
    });
  }

  // ── Logo empresa ─────────────────────────────────────────────────────
  onLogoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.mensajeEmpresa.set({ tipo: 'error', texto: 'El logo no puede superar 2 MB.' });
      return;
    }
    this.archivoLogo.set(file);
    const reader = new FileReader();
    reader.onload = e => this.logoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  guardarLogo() {
    const archivo = this.archivoLogo();
    if (!archivo) return;
    this.guardandoLogo.set(true);
    const empresaId = this.usuario()?.empresaId;
    const form = new FormData();
    form.append('archivo', archivo);
    
    this.empresaService.subirLogo(empresaId!, form).subscribe({
      // 👇 Asegúrate de recibir la respuesta "empresaActualizada"
      next: (empresaActualizada: any) => { 
        this.mensajeEmpresa.set({ tipo: 'ok', texto: 'Logo actualizado correctamente.' });
        this.archivoLogo.set(null);
        this.guardandoLogo.set(false);
        
        // 👇 ACTUALIZA EL ESTADO GLOBAL DE ANGULAR
        this.authService.updateCurrentUserState({ logoUrl: empresaActualizada.logoUrl });
      },
      error: () => {
        this.mensajeEmpresa.set({ tipo: 'error', texto: 'Error al subir el logo. Intenta de nuevo.' });
        this.guardandoLogo.set(false);
      },
    });
  }

  cancelarLogo() {
    this.logoPreview.set(null);
    this.archivoLogo.set(null);
  }

  cancelarFoto() {
    this.fotoPreview.set(null);
    this.archivoFoto.set(null);
  }
}