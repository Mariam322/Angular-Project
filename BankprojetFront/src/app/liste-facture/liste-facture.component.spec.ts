import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeFactureComponent } from './liste-facture.component';

describe('ListeFactureComponent', () => {
  let component: ListeFactureComponent;
  let fixture: ComponentFixture<ListeFactureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeFactureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeFactureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
