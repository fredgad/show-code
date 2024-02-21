import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SavedMediaComponent } from './saved-media.component';

describe('SavedMediaComponent', () => {
  let component: SavedMediaComponent;
  let fixture: ComponentFixture<SavedMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedMediaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
