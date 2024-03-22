import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { AudioBlockComponent } from './audio-block.component';
import { AudioComponent } from '@features/audio';

describe('AudioBlockComponent', () => {
  let component: AudioBlockComponent;
  let fixture: ComponentFixture<AudioBlockComponent>;

  beforeEach(async () => {
    await MockBuilder(AudioBlockComponent)
      .mock(AudioComponent);

    fixture = TestBed.createComponent(AudioBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
