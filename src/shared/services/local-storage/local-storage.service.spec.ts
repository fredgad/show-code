import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { LocalStorageService } from '../local-storage/local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => MockBuilder(LocalStorageService)
    .mock(LocalStorageService)
  );

  beforeEach(() => {
    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
