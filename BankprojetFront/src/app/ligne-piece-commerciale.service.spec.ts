import { TestBed } from '@angular/core/testing';

import { LignePieceCommercialeService } from './ligne-piece-commerciale.service';

describe('LignePieceCommercialeService', () => {
  let service: LignePieceCommercialeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LignePieceCommercialeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
