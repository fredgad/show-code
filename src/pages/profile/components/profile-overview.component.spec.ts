import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { AvatarComponent } from '@features';
import { AppStoreFacade } from '@store';
import { ProfileOverviewComponent } from './profile-overview.component';

describe('ProfileOverviewComponent', () => {
  let fixture: ComponentFixture<ProfileOverviewComponent>;
  let component: ProfileOverviewComponent;

  beforeEach(() => MockBuilder(ProfileOverviewComponent).mock(AvatarComponent).mock(AppStoreFacade));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
