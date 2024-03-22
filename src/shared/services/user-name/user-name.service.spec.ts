import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { UserNameService } from './user-name.service';

describe('UserNameService', () => {
  let service: UserNameService;

  beforeEach(() => MockBuilder(UserNameService));

  beforeEach(() => {
    service = TestBed.inject(UserNameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
