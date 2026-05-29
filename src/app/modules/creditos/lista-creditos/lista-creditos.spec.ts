import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaCreditos } from './lista-creditos';

describe('ListaCreditos', () => {
  let component: ListaCreditos;
  let fixture: ComponentFixture<ListaCreditos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaCreditos],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaCreditos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
