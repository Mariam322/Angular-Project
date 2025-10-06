import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompteListComponent } from './compte-list.component';

describe('CompteListComponent', () => {
  let component: CompteListComponent;
  let fixture: ComponentFixture<CompteListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompteListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompteListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
