import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent, FooterComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangService } from '@shared/services';
import { MockBuilder, MockInstance } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { Signal } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MainFormComponent } from './main-form.component';
import { AppStoreFacade } from '@store';

describe('MainFormComponent', () => {
  let fixture: ComponentFixture<MainFormComponent>;
  let component: MainFormComponent;

  beforeEach(() => MockBuilder(MainFormComponent)
    .keep(CommonModule)
    .keep(RouterModule)
    .mock(HttpClientTestingModule)
    .mock(HeaderComponent)
    .mock(FooterComponent)
    .mock(ImageDirective)
    .mock(TextDirective)
    .mock(ActivatedRoute)
    .mock(AppStoreFacade)
    .mock(LangService, {
      textByLanguage: jest.fn().mockImplementation(() => (() => 'Mocked Title') as Signal<string>)
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MainFormComponent);
    component = fixture.componentInstance;

    MockInstance(LangService, 'textByLanguage', jest.fn().mockImplementation(() => (() => 'Mocked Title') as Signal<string>));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
