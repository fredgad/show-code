import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { TextDirective } from '@shared/directives';
import { RequestsComponent } from './requests.component';
import { LangService } from '@shared/services';
import { Signal } from '@angular/core';

describe('RequestsComponent', () => {
  let component: RequestsComponent;
  let fixture: ComponentFixture<RequestsComponent>;

  beforeEach(async () => {
    await MockBuilder(RequestsComponent)
      .mock(TextDirective)
      .mock(LangService, {
        textByLanguage: jest.fn().mockImplementation(() => (() => 'Mocked Title') as Signal<string>)
      });

    fixture = TestBed.createComponent(RequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
