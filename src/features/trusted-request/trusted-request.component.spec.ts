import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrustedRequestComponent } from './trusted-request.component';

describe('TrustedRequestComponent', () => {
  let component: TrustedRequestComponent;
  let fixture: ComponentFixture<TrustedRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrustedRequestComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TrustedRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
