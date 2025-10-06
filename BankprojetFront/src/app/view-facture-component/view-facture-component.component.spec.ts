import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewFactureComponentComponent } from './view-facture-component.component';

describe('ViewFactureComponentComponent', () => {
  let component: ViewFactureComponentComponent;
  let fixture: ComponentFixture<ViewFactureComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewFactureComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewFactureComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
