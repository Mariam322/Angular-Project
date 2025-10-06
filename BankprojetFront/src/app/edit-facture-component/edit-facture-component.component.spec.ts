import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFactureComponentComponent } from './edit-facture-component.component';

describe('EditFactureComponentComponent', () => {
  let component: EditFactureComponentComponent;
  let fixture: ComponentFixture<EditFactureComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditFactureComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditFactureComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
