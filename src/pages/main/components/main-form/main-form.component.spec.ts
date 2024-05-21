import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService, ConfirmPopupService, LangService, UserNameService } from '@shared/services';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MainFormComponent } from './main-form.component';
import { AppStoreFacade } from '@store';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('MainFormComponent', () => {
  let component: MainFormComponent;
  let fixture: ComponentFixture<MainFormComponent>;
  let router: Router;
  let mockConfirmPopupService: jest.Mocked<Partial<ConfirmPopupService>>;
  let mockAppStoreFacade: jest.Mocked<Partial<AppStoreFacade>>;

  beforeEach(async () => {
    await MockBuilder(MainFormComponent)
      .keep(CommonModule)
      .keep(RouterModule)
      .keep(RouterTestingModule.withRoutes([]))
      .mock(HttpClientTestingModule)
      .mock(Router)
      .mock(AuthService, { isLoggedIn: jest.fn().mockReturnValue(true) }) 
      .mock(UserNameService) 
      .mock(ConfirmPopupService, { showPopup: jest.fn(() => of(true)) }) 
      .mock(AppStoreFacade, { logout: jest.fn() })
      .mock(LangService, {
        textByLanguage: jest.fn().mockImplementation(() => (() => 'Mocked Data') as Signal<string>)
      });

    fixture = TestBed.createComponent(MainFormComponent);
    component = fixture.componentInstance;
    mockConfirmPopupService = ngMocks.get(ConfirmPopupService);
    mockAppStoreFacade = ngMocks.get(AppStoreFacade);


    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to the profile page', () => {
    component.goToProfile();
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
  });

  it('should logout and navigate as expected', () => {
    component.logout();
    expect(mockConfirmPopupService.showPopup).toHaveBeenCalled();
    expect(mockAppStoreFacade.logout).toHaveBeenCalled();
  });
});
