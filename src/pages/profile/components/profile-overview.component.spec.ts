import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder } from 'ng-mocks';
import { of } from 'rxjs';
import { AvatarComponent } from '@features';
import { AppStoreFacade } from '@store';
import { ProfileOverviewComponent } from './profile-overview.component';

describe('ProfileOverviewComponent', () => {
  let fixture: ComponentFixture<ProfileOverviewComponent>;
  let component: ProfileOverviewComponent;

  beforeEach(() =>
    MockBuilder(ProfileOverviewComponent)
      .mock(AvatarComponent)
      .mock(AppStoreFacade, {
        userData$: of({ username: 'Example', keyId: 'example-id', email: 'example@example.test' }),
        userLoadStatus$: of('ready' as const)
      })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('copies the full Key ID when the button is clicked', async () => {
    const previousClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    try {
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('.key-button');
      button.click();
      await fixture.whenStable();
      expect(writeText).toHaveBeenCalledWith('example-id');
      expect(component.copyFeedback()).toBe('copied');
    } finally {
      if (previousClipboard) {
        Object.defineProperty(navigator, 'clipboard', previousClipboard);
      } else {
        Reflect.deleteProperty(navigator, 'clipboard');
      }
    }
  });
});
