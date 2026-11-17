import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, TemplateRef, ViewChild, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SiteLanguageSelectComponent } from '@features/lang';
import { LangTextI } from '@shared/interfaces';
import { AuthService, FontScaleService, LangService } from '@shared/services';
import { filter, map, tap } from 'rxjs';
import { PROFILE_NAVIGATION } from '../../../pages/profile/profile-navigation';
import { PROFILE_TEXT } from '../../../pages/profile/profile.text';
import { HEADER_PAGE_TITLES, HEADER_TEXT } from './header.text';
import { ProfileNavigationComponent } from './profile-navigation.component';

interface HeaderMenuContext {
  $implicit: { close: () => void; trigger: () => HTMLElement };
}

@Component({
  selector: 'org-header',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, SiteLanguageSelectComponent, ProfileNavigationComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.landing-header]': "layout === 'landing'",
    '[class.section-header]': "layout === 'profile' || layout === 'admin'"
  }
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly language = inject(LangService);
  private readonly auth = inject(AuthService);
  private readonly fontScale = inject(FontScaleService);

  @Input() layout: 'page' | 'landing' | 'profile' | 'admin' = 'page';
  @Input() title: string | null = null;
  @Input() navigationLabel: string | null = null;
  @Input() primaryNavigation: TemplateRef<unknown> | null = null;
  @Input() menuNavigation: TemplateRef<HeaderMenuContext> | null = null;
  @Input() showDisplayControls = true;

  @ViewChild('menu', { static: true }) private menu?: ElementRef<HTMLDetailsElement>;
  @ViewChild('menuToggle', { static: true }) private menuToggle?: ElementRef<HTMLElement>;

  readonly copy = HEADER_TEXT;
  readonly siteCopy = PROFILE_TEXT;
  readonly profile = PROFILE_NAVIGATION.profile;
  readonly profileMatch = { paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' } as const;
  readonly menuContext: HeaderMenuContext = {
    $implicit: {
      close: () => this.closeMenu(true),
      trigger: () => this.menuToggle!.nativeElement
    }
  };

  private readonly currentPath = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    tap(() => this.closeMenu()),
    map(event => event.urlAfterRedirects)
  ), { initialValue: this.router.url });
  readonly pageTitle = computed(() => {
    const route = this.currentPath().slice(1).split(/[/?#]/, 1)[0];
    const title = route === 'verify' ? PROFILE_TEXT.verify : HEADER_PAGE_TITLES[route];
    return title ? this.text(title) : 'E-stream';
  });

  get loggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get currentFontScale(): string {
    return `${Math.round(this.fontScale.scale * 16)}px`;
  }

  text(label: LangTextI): string {
    return this.language.resolveText(label);
  }

  changeFontSize(increase: boolean): void {
    if (increase) this.fontScale.increase();
    else this.fontScale.decrease();
  }

  closeMenu(restoreFocus = false): void {
    const menu = this.menu?.nativeElement;
    if (!menu?.open) return;
    menu.open = false;
    if (restoreFocus) this.menuToggle?.nativeElement.focus({ preventScroll: true });
  }

  closeAfterLink(event: MouseEvent): void {
    if (event.composedPath().some(node => node instanceof HTMLAnchorElement && node.hasAttribute('href'))) {
      this.closeMenu(true);
    }
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:pointerdown', ['$event'])
  closeOnOutsideClick(event: Event): void {
    const menu = this.menu?.nativeElement;
    if (menu?.open && !event.composedPath().includes(menu)) this.closeMenu();
  }

  @HostListener('document:keydown.escape', ['$event'])
  closeOnEscape(event: KeyboardEvent): void {
    const menu = this.menu?.nativeElement;
    if (!menu?.open) return;
    const inside = event.composedPath().includes(menu);
    this.closeMenu(inside);
    if (inside) event.preventDefault();
  }

  @HostListener('window:resize')
  closeIfToggleIsHidden(): void {
    if (!this.menuToggle?.nativeElement.getClientRects().length) this.closeMenu();
  }
}
