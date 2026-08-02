import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MockBuilder } from 'ng-mocks';
import { FooterComponent, HeaderComponent } from '@widgets';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;

  beforeEach(() => MockBuilder(ProfileComponent).keep(RouterModule).mock(HeaderComponent).mock(FooterComponent).mock(ActivatedRoute));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
