import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { WindowEventsService } from './window-events.service';

describe('WindowEventsService', () => {
  let service: WindowEventsService;

  beforeEach(() => MockBuilder(WindowEventsService));

  beforeEach(() => {
    service = TestBed.inject(WindowEventsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
