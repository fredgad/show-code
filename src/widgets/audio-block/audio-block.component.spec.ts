import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AudioBlockComponent } from './audio-block.component';

describe('AudioBlockComponent', () => {
  let component: AudioBlockComponent;
  let fixture: ComponentFixture<AudioBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioBlockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
