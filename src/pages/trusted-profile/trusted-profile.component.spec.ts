import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrustedProfileComponent } from './trusted-profile.component';

describe('TrustedProfileComponent', () => {
  let component: TrustedProfileComponent;
  let fixture: ComponentFixture<TrustedProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrustedProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrustedProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
