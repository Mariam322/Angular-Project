import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddreglementComponent } from './addreglement.component';

describe('AddreglementComponent', () => {
  let component: AddreglementComponent;
  let fixture: ComponentFixture<AddreglementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddreglementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddreglementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
