import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent, FooterComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { MockBuilder } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { VideoPageComponent } from './video-page.component';
import { LangService } from '../../../shared';
import { Signal } from '@angular/core';

describe('VideoPageComponent', () => {
  let fixture: ComponentFixture<VideoPageComponent>;
  let component: VideoPageComponent;

  beforeEach(() => MockBuilder(VideoPageComponent)
    .keep(CommonModule)
    .mock(HeaderComponent)
    .mock(FooterComponent)
    .mock(ImageDirective)
    .mock(TextDirective)
    .mock(LangService, {
      textByLanguage: jest.fn().mockImplementation(() => (() => 'Mocked Title') as Signal<string>)
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoPageComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
