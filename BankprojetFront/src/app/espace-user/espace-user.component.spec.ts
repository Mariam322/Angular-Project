import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EspaceUserComponent } from './espace-user.component';

describe('EspaceUserComponent', () => {
  let component: EspaceUserComponent;
  let fixture: ComponentFixture<EspaceUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EspaceUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EspaceUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
