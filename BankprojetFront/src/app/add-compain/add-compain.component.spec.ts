import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCompainComponent } from './add-compain.component';

describe('AddCompteComponent', () => {
  let component: AddCompainComponent;
  let fixture: ComponentFixture<AddCompainComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddCompainComponent]
    });
    fixture = TestBed.createComponent(AddCompainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
