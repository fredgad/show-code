
import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { LangService } from './lang.service';
import { LocalStorageService } from '../local-storage/local-storage.service';

describe('LangService', () => {
  let service: LangService;

  beforeEach(() => MockBuilder(LangService)
    .mock(LocalStorageService)
  );

  beforeEach(() => {
    service = TestBed.inject(LangService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
  