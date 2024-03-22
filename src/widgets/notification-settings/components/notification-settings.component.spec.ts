import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { TextDirective } from '@shared/directives';
import { NotificationSettingsComponent } from './notification-settings.component';
import { LangService } from '@shared/services';
import { Signal } from '@angular/core';

describe('NotificationSettingsComponent', () => {
  let component: NotificationSettingsComponent;
  let fixture: ComponentFixture<NotificationSettingsComponent>;

  beforeEach(async () => {
    await MockBuilder(NotificationSettingsComponent)
      .mock(TextDirective)
      .mock(LangService, {
        textByLanguage: jest.fn().mockImplementation(() => (() => 'Mocked Title') as Signal<string>)
      })

    fixture = TestBed.createComponent(NotificationSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
