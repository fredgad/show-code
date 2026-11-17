import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { APP_API_URL } from '@shared/constants';
import { LangTextI } from '@shared/interfaces';
import { AuthService, LangService, LocalStorageService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { BehaviorSubject } from 'rxjs';
import { ProfileNavigationComponent } from './profile-navigation.component';

describe('ProfileNavigationComponent', () => {
  const sessionUrl = `${APP_API_URL}/api/admin/session`;
  let http: HttpTestingController;
  let browserToken: string | null;
  let token$: BehaviorSubject<string | null>;

  const openNavigation = (inMenu = false) => {
    const fixture = TestBed.createComponent(ProfileNavigationComponent);
    fixture.componentRef.setInput('inMenu', inMenu);
    fixture.detectChanges();
    return fixture;
  };

  const linksUnderProfile = (fixture: ComponentFixture<ProfileNavigationComponent>) => {
    fixture.detectChanges();
    return Array.from(
      fixture.nativeElement.querySelector('.nav-group').querySelectorAll('a') as NodeListOf<HTMLAnchorElement>,
      link => link.getAttribute('href')
    );
  };

  beforeEach(() => {
    browserToken = 'stored-session';
    token$ = new BehaviorSubject<string | null>('');
    TestBed.configureTestingModule({
      imports: [ProfileNavigationComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isLoggedIn: () => Boolean(browserToken) } },
        { provide: LocalStorageService, useValue: { getItem: () => browserToken } },
        { provide: LangService, useValue: { resolveText: (label: LangTextI) => label.ENG } },
        { provide: AppStoreFacade, useValue: { token$ } }
      ]
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it.each([true, false])('adds the link immediately after Profile for an authorized session (users: %s)', users => {
    const sidebar = openNavigation();
    const menu = openNavigation(true);
    expect(linksUnderProfile(sidebar)).toEqual(['/profile']);

    http.expectOne(sessionUrl).flush({ admin: { id: 'staff', username: 'Staff', permissions: { users, billing: true } } });
    expect(linksUnderProfile(sidebar)).toEqual(['/profile', '/admin']);
    expect(linksUnderProfile(menu)).toEqual(['/profile', '/admin']);
  });

  it('keeps the link hidden for an ordinary user', () => {
    const navigation = openNavigation();
    http.expectOne(sessionUrl).flush({}, { status: 403, statusText: 'Forbidden' });

    expect(linksUnderProfile(navigation)).toEqual(['/profile']);
  });

  it('does not check administrator access for signed-out visitors', () => {
    browserToken = null;
    const navigation = openNavigation();

    http.expectNone(sessionUrl);
    expect(linksUnderProfile(navigation)).toEqual(['/profile']);
  });

  it('cancels a pending check and hides the link when the user signs out', () => {
    const navigation = openNavigation();
    const request = http.expectOne(sessionUrl);
    token$.next(null);

    expect(request.cancelled).toBe(true);
    http.expectNone(sessionUrl);
    expect(linksUnderProfile(navigation)).toEqual(['/profile']);
  });
});
