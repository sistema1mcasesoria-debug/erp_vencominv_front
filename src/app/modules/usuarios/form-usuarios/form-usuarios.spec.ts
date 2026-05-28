import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormUsuarios } from './form-usuarios';

describe('FormUsuarios', () => {
  let component: FormUsuarios;
  let fixture: ComponentFixture<FormUsuarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormUsuarios],
    }).compileComponents();

    fixture = TestBed.createComponent(FormUsuarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
