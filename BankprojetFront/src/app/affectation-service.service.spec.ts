import { TestBed } from '@angular/core/testing';

import { AffectationServiceService } from './affectation-service.service';

describe('AffectationServiceService', () => {
  let service: AffectationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AffectationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
