import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OmpaignListComponent } from './ompaign-list.component';

describe('OmpaignListComponent', () => {
  let component: OmpaignListComponent;
  let fixture: ComponentFixture<OmpaignListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OmpaignListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OmpaignListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
