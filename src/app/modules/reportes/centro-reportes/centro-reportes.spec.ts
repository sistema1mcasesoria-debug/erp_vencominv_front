import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CentroReportes } from './centro-reportes';

describe('CentroReportes', () => {
  let component: CentroReportes;
  let fixture: ComponentFixture<CentroReportes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CentroReportes],
    }).compileComponents();

    fixture = TestBed.createComponent(CentroReportes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
