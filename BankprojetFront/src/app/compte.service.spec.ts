import { TestBed } from '@angular/core/testing';
import { CompainService } from '../services/compain.service';


describe('CompteService', () => {
  let service: CompainService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompainService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
