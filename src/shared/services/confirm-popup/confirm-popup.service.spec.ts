import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { ConfirmPopupService } from './confirm-popup.service';

describe('ConfirmPopupService', () => {
  let service: ConfirmPopupService;

  beforeEach(() => MockBuilder(ConfirmPopupService));

  beforeEach(() => {
    service = TestBed.inject(ConfirmPopupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
