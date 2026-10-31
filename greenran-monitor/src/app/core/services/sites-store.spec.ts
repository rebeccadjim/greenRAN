import { TestBed } from '@angular/core/testing';
import { SitesStore } from './sites-store';

describe('SitesStore', () => {
  let service: SitesStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SitesStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
