import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatefactreComponent } from './updatefactre.component';

describe('UpdatefactreComponent', () => {
  let component: UpdatefactreComponent;
  let fixture: ComponentFixture<UpdatefactreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatefactreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatefactreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
