import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompainComponent } from './compain.component';

describe('ComptesComponent', () => {
  let component: CompainComponent;
  let fixture: ComponentFixture<CompainComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CompainComponent]
    });
    fixture = TestBed.createComponent(CompainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
