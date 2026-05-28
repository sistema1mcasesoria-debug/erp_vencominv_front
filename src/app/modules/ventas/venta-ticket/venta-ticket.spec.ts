import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VentaTicket } from './venta-ticket';

describe('VentaTicket', () => {
  let component: VentaTicket;
  let fixture: ComponentFixture<VentaTicket>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentaTicket],
    }).compileComponents();

    fixture = TestBed.createComponent(VentaTicket);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
