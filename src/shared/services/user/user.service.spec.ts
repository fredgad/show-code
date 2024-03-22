import { TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { UserService } from './user.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => MockBuilder(UserService)
    .mock(HttpClientTestingModule)
  );

  beforeEach(() => {
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
