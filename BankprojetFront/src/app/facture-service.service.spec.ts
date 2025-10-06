import { TestBed } from '@angular/core/testing';

import { FactureServiceService } from '../services/facture-service.service';

describe('FactureServiceService', () => {
  let service: FactureServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FactureServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
