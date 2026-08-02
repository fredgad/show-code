import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  Output,
  Signal,
  ViewChild,
  computed,
  inject
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { LogoComponent, OverflowMarqueeComponent } from '@features';
import { NavigationEnd, Router, RouterModule, UrlTree } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LangComponent } from '@features/lang';
import { ImageDirective, TextDirective } from '@shared/directives';
import { MOBILE_BREAKPOINT, PRESENTATION_URLS } from '@shared/constants';
import { AuthService, FontScaleService, LangService, WindowEventsService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { LangTextI } from '@shared/interfaces';
import { AppDrawerComponent } from '../../app-drawer';

const HEADER_PAGE_TITLES: Array<{ pattern: RegExp; title: LangTextI }> = [
  {
    pattern: /^\/profile\/saved-media(?:\/|$)/,
    title: { ENG: 'Saved media', ESP: 'Medios guardados', RUS: 'Сохранённые медиа' }
  },
  {
    pattern: /^\/profile\/trusted-people(?:\/|$)/,
    title: { ENG: 'Trusted people', ESP: 'Personas de confianza', RUS: 'Доверенные люди' }
  },
  {
    pattern: /^\/profile\/requests(?:\/|$)/,
    title: { ENG: 'Requests', ESP: 'Solicitudes', RUS: 'Запросы' }
  },
  {
    pattern: /^\/profile\/notification-settings(?:\/|$)/,
    title: { ENG: 'Notification settings', ESP: 'Ajustes de notificaciones', RUS: 'Настройки оповещений' }
  },
  {
    pattern: /^\/profile\/account-settings(?:\/|$)/,
    title: { ENG: 'Account settings', ESP: 'Ajustes de la cuenta', RUS: 'Настройки аккаунта' }
  },
  { pattern: /^\/profile(?:\/|$)/, title: { ENG: 'Profile', ESP: 'Perfil', RUS: 'Профиль' } },
  { pattern: /^\/auth(?:\/|$)/, title: { ENG: 'Authorization', ESP: 'Autorización', RUS: 'Авторизация' } },
  { pattern: /^\/registration(?:\/|$)/, title: { ENG: 'Registration', ESP: 'Registro', RUS: 'Регистрация' } },
  {
    pattern: /^\/password-recovery(?:\/|$)/,
    title: { ENG: 'Password recovery', ESP: 'Recuperación de contraseña', RUS: 'Восстановление пароля' }
  },
  { pattern: /^\/verify(?:\/|$)/, title: { ENG: 'Verification', ESP: 'Verificación', RUS: 'Верификация' } },
  {
    pattern: /^\/trusted-profile(?:\/|$)/,
    title: { ENG: 'Trusted profile', ESP: 'Perfil de confianza', RUS: 'Доверенный профиль' }
  },
  {
    pattern: /^\/settings(?:\/|$)/,
    title: { ENG: 'Application settings', ESP: 'Ajustes de la aplicación', RUS: 'Настройки приложения' }
  },
  { pattern: /^\/capture(?:\/|$)/, title: { ENG: 'Video recorder', ESP: 'Grabadora de vídeo', RUS: 'Видеорегистратор' } }
];

@Component({
  selector: 'org-header',
  standalone: true,
  imports: [
    CommonModule,
    LogoComponent,
    OverflowMarqueeComponent,
    LangComponent,
    TextDirective,
    ImageDirective,
    RouterModule,
    AppDrawerComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent implements OnDestroy {
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private authService = inject(AuthService);
  private fontScaleService = inject(FontScaleService);
  private langService = inject(LangService);
  private windowEventsService = inject(WindowEventsService);

  @Input() public showDisplayControls = true;
  @Output() public fontDecrease = new EventEmitter<void>();
  @Output() public fontIncrease = new EventEmitter<void>();
  @ViewChild('menuButton') private menuButton?: ElementRef<HTMLButtonElement>;

  @HostBinding('class.header-hidden') public isHeaderHidden = false;
  public isMenuOpen = false;

  public isMobile$ = this.windowEventsService.isMobile$;
  public userData$ = inject(AppStoreFacade).userData$;
  private lastScrollTop = 0;
  private readonly topRevealOffset = 8;
  private readonly scrollDeltaThreshold = 4;
  private keepVisibleAfterFontChangeUntil = 0;
  private currentUrl$i = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  public abbrTitle$i: Signal<string> = this.langService.textByLanguage({
    ENG: 'Profile settings',
    ESP: 'Configuración de perfil',
    RUS: 'Настройки профиля'
  });

  public presentationUrl$i: Signal<string> = this.langService.textByLanguage(PRESENTATION_URLS);
  public pageTitle$i: Signal<string> = computed(() => {
    const path = this.currentUrl$i().split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
    const currentPage = HEADER_PAGE_TITLES.find(page => page.pattern.test(path));

    return currentPage ? this.langService.resolveText(currentPage.title) : 'E-stream';
  });

  public get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  public get isMainRoute(): boolean {
    return this.router.url.split(/[?#]/, 1)[0].replace(/\/+$/, '') === '';
  }

  public get currentFontScale(): string {
    return `${Math.round(this.fontScaleService.scale * 16)}px`;
  }

  public goToPath(path: string | UrlTree): void {
    this.router.navigateByUrl(path);
  }

  public decreaseFont(): void {
    this.keepHeaderVisibleDuringFontChange();
    this.fontScaleService.decrease();
    this.fontDecrease.emit();
  }

  public increaseFont(): void {
    this.keepHeaderVisibleDuringFontChange();
    this.fontScaleService.increase();
    this.fontIncrease.emit();
  }

  public toggleMenu(): void {
    this.isMenuOpen ? this.closeMenu() : this.openMenu();
  }

  public openMenu(): void {
    this.isMenuOpen = true;
    this.document.body.classList.add('app-drawer-open');
  }

  public closeMenu(returnFocus = true): void {
    if (!this.isMenuOpen) {
      return;
    }

    this.isMenuOpen = false;
    this.document.body.classList.remove('app-drawer-open');

    if (returnFocus && typeof window !== 'undefined') {
      window.requestAnimationFrame(() => this.menuButton?.nativeElement.focus());
    }
  }

  @HostListener('document:keydown.escape')
  public onEscape(): void {
    this.closeMenu();
  }

  @HostListener('window:resize')
  public onWindowResize(): void {
    if (this.isMobileViewport) {
      this.isHeaderHidden = false;
      return;
    }

    this.closeMenu(false);
  }

  @HostListener('window:scroll')
  public onWindowScroll(): void {
    const currentScrollTop = this.windowEventsService.currentScrollTop;
    const scrollDelta = currentScrollTop - this.lastScrollTop;

    if (this.isMobileViewport) {
      this.isHeaderHidden = false;
      this.lastScrollTop = currentScrollTop;
      return;
    }

    if (Date.now() < this.keepVisibleAfterFontChangeUntil) {
      this.isHeaderHidden = false;
      this.lastScrollTop = currentScrollTop;
      return;
    }

    if (currentScrollTop <= this.topRevealOffset) {
      this.isHeaderHidden = false;
      this.lastScrollTop = 0;
      return;
    }

    if (Math.abs(scrollDelta) < this.scrollDeltaThreshold) {
      return;
    }

    this.isHeaderHidden = scrollDelta > 0;
    this.lastScrollTop = currentScrollTop;
  }

  private keepHeaderVisibleDuringFontChange(): void {
    this.isHeaderHidden = false;
    this.lastScrollTop = this.windowEventsService.currentScrollTop;
    this.keepVisibleAfterFontChangeUntil = Date.now() + 450;
  }

  public ngOnDestroy(): void {
    this.document.body.classList.remove('app-drawer-open');
  }

  private get isMobileViewport(): boolean {
    return this.windowEventsService.currentScreenWidth <= MOBILE_BREAKPOINT;
  }
}
