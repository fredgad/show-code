import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ActivatedRouteSnapshot, RouterModule, convertToParamMap } from '@angular/router';
import { HeaderComponent, FooterComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangService } from '@shared/services';
import { LangEnum } from '@shared/interfaces';
import { MockBuilder } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { AuthorizationComponent } from './authorization.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppStoreFacade } from '@store';


describe('AuthorizationComponent', () => {
  let fixture: ComponentFixture<AuthorizationComponent>;
  let component: AuthorizationComponent;

  beforeEach(() => MockBuilder(AuthorizationComponent)
    .keep(CommonModule)
    .keep(RouterModule)
    .mock(ActivatedRoute, { snapshot: { queryParamMap: convertToParamMap({}) } as ActivatedRouteSnapshot })
    .mock(HttpClientTestingModule)
    .mock(HeaderComponent)
    .mock(FooterComponent)
    .mock(ImageDirective)
    .mock(TextDirective)
    .mock(LangService, { getLang$i: signal(LangEnum.ENG) })
    .mock(AppStoreFacade)
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthorizationComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
