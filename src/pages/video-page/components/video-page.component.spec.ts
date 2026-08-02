import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent, FooterComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { MockBuilder } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { VideoPageComponent } from './video-page.component';
import { LangService, RecordingUploadService } from '@shared/services';
import { Signal } from '@angular/core';
import { of } from 'rxjs';

describe('VideoPageComponent', () => {
  let fixture: ComponentFixture<VideoPageComponent>;
  let component: VideoPageComponent;

  beforeEach(() =>
    MockBuilder(VideoPageComponent)
      .keep(CommonModule)
      .mock(HeaderComponent)
      .mock(FooterComponent)
      .mock(ImageDirective)
      .mock(TextDirective)
      .mock(LangService, {
        textByLanguage: jest.fn().mockImplementation(() => (() => 'Mocked Title') as Signal<string>),
        resolveText: jest.fn().mockImplementation(text => text?.ENG || '')
      })
      .mock(RecordingUploadService, { upload: jest.fn().mockReturnValue(of({})) })
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
