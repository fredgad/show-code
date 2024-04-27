import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent, FooterComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangService } from '@shared/services';
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
    .mock(HttpClientTestingModule)
    .mock(HeaderComponent)
    .mock(FooterComponent)
    .mock(ImageDirective)
    .mock(TextDirective)
    .mock(LangService)
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
