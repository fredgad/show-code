import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent, FooterComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangService, LocalStorageService, WindowEventsService } from '@shared/services';
import { MockBuilder, MockInstance } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Signal } from '@angular/core';
import { MainComponent } from './main.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('MainComponent', () => {
  let fixture: ComponentFixture<MainComponent>;
  let component: MainComponent;

  beforeEach(() => MockBuilder(MainComponent)
    .keep(CommonModule)
    .keep(RouterModule)
    .mock(HttpClientTestingModule)
    .mock(HeaderComponent)
    .mock(FooterComponent)
    .mock(ImageDirective)
    .mock(TextDirective)
    .mock(ActivatedRoute)
    .mock(LangService, {
      textByLanguage: jest.fn().mockImplementation(() => (() => 'Mocked Title') as Signal<string>)
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;

    MockInstance(LangService, 'textByLanguage', jest.fn().mockImplementation(() => (() => 'Mocked Title') as Signal<string>));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
