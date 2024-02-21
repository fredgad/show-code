import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrustedPeopleComponent } from './trusted-people.component';

describe('TrustedPeopleComponent', () => {
  let component: TrustedPeopleComponent;
  let fixture: ComponentFixture<TrustedPeopleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrustedPeopleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrustedPeopleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
