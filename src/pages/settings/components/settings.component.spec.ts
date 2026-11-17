import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { LangService } from '@shared/services';
import { AccountSettingsComponent } from '@widgets/account-settings';
import { HeaderComponent } from '@widgets/header';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let component: SettingsComponent;

  beforeEach(() => MockBuilder(SettingsComponent)
    .keep(LangService)
    .mock(HeaderComponent)
    .mock(AccountSettingsComponent)
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
