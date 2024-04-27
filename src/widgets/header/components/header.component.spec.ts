import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { LangComponent, LogoComponent } from '@features';
import { ImageDirective, TextDirective } from '@shared/directives';
import { HeaderComponent } from './header.component';
import { AuthService } from '@shared/services';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await MockBuilder(HeaderComponent)
      .mock(LogoComponent)
      .mock(LangComponent)
      .mock(TextDirective)
      .mock(ImageDirective)
      .mock(AuthService)

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
