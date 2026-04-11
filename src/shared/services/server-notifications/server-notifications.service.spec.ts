import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MockBuilder } from 'ng-mocks';
import { ServerNotificationsService } from './server-notifications.service';
import { NotificationService } from '../notification/notification.service';

describe('ServerNotificationsService', () => {
  let service: ServerNotificationsService;

  beforeEach(() => MockBuilder(ServerNotificationsService).mock(HttpClientTestingModule).mock(NotificationService));

  beforeEach(() => {
    service = TestBed.inject(ServerNotificationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
