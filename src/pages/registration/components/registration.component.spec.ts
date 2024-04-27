import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent, FooterComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { AuthService, LangService } from '@shared/services';
import { MockBuilder } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { RegistrationComponent } from './registration.component';
import { AppStoreFacade } from '@store';

describe('RegistrationComponent', () => {
  let fixture: ComponentFixture<RegistrationComponent>;
  let component: RegistrationComponent;

  beforeEach(() => MockBuilder(RegistrationComponent)
    .keep(CommonModule)
    .mock(HeaderComponent)
    .mock(FooterComponent)
    .mock(ImageDirective)
    .mock(TextDirective)
    .mock(LangService)
    .mock(AuthService)
    .mock(AppStoreFacade)
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
