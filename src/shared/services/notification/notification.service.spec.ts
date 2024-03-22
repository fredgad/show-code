import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => MockBuilder(NotificationService));

  beforeEach(() => {
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
