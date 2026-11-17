import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LangEnum, LangTextI } from '@shared/interfaces';
import { AuthService, FontScaleService, LangService } from '@shared/services';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let menu: HTMLDetailsElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => false } },
        { provide: LangService, useValue: { getLang$i: signal(LangEnum.ENG), resolveText: (label: LangTextI) => label.ENG } },
        { provide: FontScaleService, useValue: { scale: 1, decrease: jest.fn(), increase: jest.fn() } }
      ]
    });

    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    menu = fixture.nativeElement.querySelector('details');
  });

  it('keeps the menu open for clicks inside and dismisses it for outside clicks', () => {
    menu.open = true;

    menu.querySelector('.font-buttons button')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(menu.open).toBe(true);

    fixture.nativeElement.querySelector('.brand').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(menu.open).toBe(false);

    menu.open = true;
    fixture.nativeElement.querySelector('.brand').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(menu.open).toBe(false);
  });

  it('returns focus to the toggle when Escape is pressed in the menu', () => {
    menu.open = true;
    const control = menu.querySelector<HTMLButtonElement>('.font-buttons button')!;
    control.focus();
    control.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(menu.open).toBe(false);
    expect(document.activeElement).toBe(menu.querySelector('summary'));
  });
});
