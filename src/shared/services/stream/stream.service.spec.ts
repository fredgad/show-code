import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MockBuilder } from 'ng-mocks';
import { StreamService } from './stream.service';
import { NotificationService } from '../notification/notification.service';

describe('StreamService', () => {
  let service: StreamService;

  beforeEach(() => MockBuilder(StreamService).mock(HttpClientTestingModule).mock(NotificationService));

  beforeEach(() => {
    service = TestBed.inject(StreamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
