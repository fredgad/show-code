import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MockBuilder } from 'ng-mocks';
import { AuthService } from './auth.service';
import { NotificationService } from '../notification/notification.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => MockBuilder(AuthService)
    .mock(HttpClientTestingModule)
    .mock(NotificationService)
  );

  beforeEach(() => {
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
