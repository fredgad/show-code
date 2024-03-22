import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoBlockComponent } from './video-block.component';
import { MockBuilder } from 'ng-mocks';
import { CommonModule } from '@angular/common';
import { VideoComponent } from '@features';

describe('VideoBlockComponent', () => {
  let fixture: ComponentFixture<VideoBlockComponent>;
  let component: VideoBlockComponent;

  beforeEach(() => MockBuilder(VideoBlockComponent)
  .keep(CommonModule)
  .mock(VideoComponent)
);

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoBlockComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
