// src/app/features/ventas/venta-ticket/venta-ticket.ts
import { Component, input, output, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VentaResponse } from '../../../core/models/venta.model';

@Component({
  selector: 'app-venta-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './venta-ticket.html'
})
export class VentaTicket {
  venta = input<VentaResponse | null>(null);
  isOpen = input<boolean>(false);
  onCerrar = output<void>();

  // Señales con valores por defecto por si falla la carga
  empresaNombre = signal('EMPRESA NO DEFINIDA');
  empresaRuc = signal('00000000000');
  empresaDireccion = signal('Dirección no registrada');

  porcentajeIgv = computed(() => {
    const v = this.venta();
    if (!v || !v.subtotalSinImpuesto || v.subtotalSinImpuesto === 0) return 0;
    
    const porcentaje = (v.impuestoTotal / v.subtotalSinImpuesto) * 100;
    return Math.round(porcentaje); // Redondeamos para que salga 18, 10 o 0 exacto
  });
  
  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.cargarDatosEmpresa();
      }
    });
  }

  cargarDatosEmpresa() {
    try {
      // OPCIÓN A: Si tienes un JSON guardado en el LocalStorage con los datos del usuario/empresa
      const usuarioStorage = localStorage.getItem('usuario_erp'); // Cambia esto por tu variable real
      if (usuarioStorage) {
        const usuarioData = JSON.parse(usuarioStorage);
        // Ajusta estos nombres según lo que devuelva tu API de Login
        this.empresaNombre.set(usuarioData.empresaNombre || 'MI EMPRESA S.A.C.');
        this.empresaRuc.set(usuarioData.empresaRuc || '20123456789');
        this.empresaDireccion.set(usuarioData.empresaDireccion || 'Dirección de la sucursal');
        return;
      }

      // OPCIÓN B: Si los datos viajan dentro del Token JWT
      const token = localStorage.getItem('token'); 
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.empresaNombre.set(payload.empresaNombre || 'MI EMPRESA S.A.C.');
        this.empresaRuc.set(payload.ruc || '20123456789');
        this.empresaDireccion.set(payload.direccion || 'Dirección Central');
      }
    } catch (e) {
      console.error('No se pudo cargar la info de la empresa para el ticket', e);
    }
  }

  imprimir() {
    // Al ejecutar esto, el CSS Global ocultará todo excepto el #ticket-impresion
    setTimeout(() => {
      window.print();
    }, 100); // Pequeño retraso para asegurar que el navegador renderice bien antes de imprimir
  }

  cerrar() {
    this.onCerrar.emit();
  }
}