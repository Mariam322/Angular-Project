import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffectationReglementComponent } from './affectation-reglement.component';

describe('AffectationReglementComponent', () => {
  let component: AffectationReglementComponent;
  let fixture: ComponentFixture<AffectationReglementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffectationReglementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AffectationReglementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
