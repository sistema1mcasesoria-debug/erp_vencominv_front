// src/app/features/usuarios/form-usuarios/form-usuarios.component.ts
import { Component, signal, inject, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Usuario, UsuarioRequest } from '../../../core/models/usuario.model';
import { Rol } from '../../../core/models/rol.model';

@Component({
  selector: 'app-form-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-usuarios.html',
})
export class FormUsuarios {
  private usuarioService = inject(UsuarioService);

  // Inputs desde el componente padre
  isOpen = input<boolean>(false);
  usuarioParaEditar = input<Usuario | null>(null);
  roles = input<Rol[]>([]);

  // Outputs para avisar al padre
  onCerrar = output<void>();
  onGuardadoExitoso = output<void>();

  // Estados internos del formulario
  isEditMode = signal(false);
  submitting = signal(false);
  errorModal = signal('');

  formUsername = signal('');
  formPassword = signal('');
  formNombreCompleto = signal('');
  formRolId = signal<number | null>(null);

  constructor() {
    // Escuchamos los cambios en el input 'usuarioParaEditar' usando un effect moderno
    effect(() => {
      const usuario = this.usuarioParaEditar();
      if (usuario) {
        this.isEditMode.set(true);
        this.formUsername.set(usuario.username);
        this.formPassword.set(''); 
        this.formNombreCompleto.set(usuario.nombreCompleto);
        this.formRolId.set(usuario.rolId);
      } else {
        this.isEditMode.set(false);
        this.formUsername.set('');
        this.formPassword.set('');
        this.formNombreCompleto.set('');
        this.formRolId.set(null);
      }
      this.errorModal.set('');
    });
  }

  cerrar() {
    this.onCerrar.emit();
  }

  guardarUsuario() {
    if (!this.formUsername() || !this.formNombreCompleto() || !this.formRolId()) {
      this.errorModal.set('Todos los campos marcados con (*) son obligatorios.');
      return;
    }

    this.submitting.set(true);
    this.errorModal.set('');

    const payload: UsuarioRequest = {
      username: this.formUsername().trim(),
      nombreCompleto: this.formNombreCompleto().trim(),
      rolId: Number(this.formRolId())
    };

    if (this.isEditMode()) {
      if (this.formPassword().trim()) {
        payload.password = this.formPassword().trim();
      }
    } else {
      payload.password = this.formPassword().trim() ? this.formPassword().trim() : '12345678';
    }

    const request$ = this.isEditMode()
      ? this.usuarioService.actualizarUsuario(this.usuarioParaEditar()!.id, payload)
      : this.usuarioService.crearUsuario(payload);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.onGuardadoExitoso.emit(); // Avisamos que guardó para recargar la tabla
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorModal.set(err.error?.message || err.error?.error || 'Error 400: Parámetros inválidos.');
      }
    });
  }
}
