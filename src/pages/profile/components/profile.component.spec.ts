import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { HeaderComponent, FooterComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangService, LocalStorageService, WindowEventsService } from '@shared/services';
import { MockBuilder, MockInstance, ngMocks } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Signal } from '@angular/core';

describe('ProfileComponent with ng-mocks', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;

  beforeEach(() => MockBuilder(ProfileComponent)
    .keep(CommonModule)
    .keep(RouterModule)
    .mock(HeaderComponent)
    .mock(FooterComponent)
    .mock(ImageDirective)
    .mock(TextDirective)
    .mock(LocalStorageService)
    .mock(ActivatedRoute)
    .mock(WindowEventsService, {
      isMobile$: new BehaviorSubject<boolean>(false)
    })
    .mock(LangService, {
      textByLanguage: jest.fn().mockImplementation(() => (() => 'Mocked Title') as Signal<string>)
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;

    MockInstance(LocalStorageService, 'getItem', jest.fn().mockReturnValue(null));
    MockInstance(LocalStorageService, 'setItem', jest.fn());
    MockInstance(WindowEventsService, 'isMobile$', new BehaviorSubject<boolean>(false));
    MockInstance(LangService, 'textByLanguage', jest.fn().mockImplementation(() => (() => 'Mocked Title') as Signal<string>));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle menu visibility', () => {
    expect(component.isMenuOpen).toBeTruthy();
    component.onMenuClick();
    expect(component.isMenuOpen).toBeFalsy();
    component.onMenuClick();
    expect(component.isMenuOpen).toBeTruthy();
  });

  it('should handle mobile state from WindowEventsService', () => {
    TestBed.inject(WindowEventsService).isMobile$.subscribe((isMobile) => {
      expect(isMobile).toBeFalsy();
    });
  });
});
