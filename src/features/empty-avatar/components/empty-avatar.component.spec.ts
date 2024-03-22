import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { EmptyAvatarComponent } from './empty-avatar.component';

describe('EmptyAvatarComponent', () => {
  let component: EmptyAvatarComponent;
  let fixture: ComponentFixture<EmptyAvatarComponent>;

  beforeEach(async () => {
    await MockBuilder(EmptyAvatarComponent)

    fixture = TestBed.createComponent(EmptyAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
