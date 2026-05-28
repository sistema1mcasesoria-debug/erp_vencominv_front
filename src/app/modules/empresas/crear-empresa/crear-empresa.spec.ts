import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearEmpresa } from './crear-empresa';

describe('CrearEmpresa', () => {
  let component: CrearEmpresa;
  let fixture: ComponentFixture<CrearEmpresa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearEmpresa],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearEmpresa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
