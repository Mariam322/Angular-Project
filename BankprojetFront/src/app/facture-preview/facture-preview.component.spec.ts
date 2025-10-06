import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturePreviewComponent } from './facture-preview.component';

describe('FacturePreviewComponent', () => {
  let component: FacturePreviewComponent;
  let fixture: ComponentFixture<FacturePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturePreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
