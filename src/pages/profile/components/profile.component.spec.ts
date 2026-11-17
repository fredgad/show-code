import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MockBuilder } from 'ng-mocks';
import { AppStoreFacade } from '@store';
import { HeaderComponent, ProfileNavigationComponent } from '@widgets/header';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;

  beforeEach(() =>
    MockBuilder(ProfileComponent)
      .keep(RouterModule)
      .mock(HeaderComponent)
      .mock(ProfileNavigationComponent)
      .mock(AppStoreFacade)
      .mock(ActivatedRoute)
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
