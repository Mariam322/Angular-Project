import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeDepenseComponent } from './liste-depense.component';

describe('ListeDepenseComponent', () => {
  let component: ListeDepenseComponent;
  let fixture: ComponentFixture<ListeDepenseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeDepenseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeDepenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
