import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuevaVenta } from './nueva-venta';

describe('NuevaVenta', () => {
  let component: NuevaVenta;
  let fixture: ComponentFixture<NuevaVenta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaVenta],
    }).compileComponents();

    fixture = TestBed.createComponent(NuevaVenta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
