import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, LangService } from '@shared/services';
import { HeaderComponent } from '@widgets/header';
import { filter, map } from 'rxjs';
import { AdminApiService, AdminSession } from './admin-api.service';
import { adminText } from './admin.text';

@Component({
  selector: 'org-admin-shell',
  standalone: true,
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, RouterOutlet, HeaderComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShellComponent implements OnInit {
  private readonly api = inject(AdminApiService);
  private readonly auth = inject(AuthService);
  private readonly language = inject(LangService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly url = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(event => event.urlAfterRedirects)
  ), { initialValue: this.router.url });

  readonly session = signal<AdminSession | null>(null);
  readonly state = signal<'loading' | 'loginRequired' | 'adminForbidden' | 'error'>('loading');
  readonly pageAllowed = computed(() => this.session()?.permissions.users || /^\/admin\/(?:payments|audit)(?:[/?#]|$)/.test(this.url()));

  ngOnInit(): void {
    if (this.browser) this.load();
  }

  text(key: keyof typeof adminText): string {
    return this.language.resolveText(adminText[key]);
  }

  load(): void {
    if (!this.auth.isLoggedIn()) {
      this.state.set('loginRequired');
      return;
    }
    this.state.set('loading');
    this.api.session().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => this.session.set(result.admin),
      error: (error: HttpErrorResponse) => this.state.set(
        error.status === 401 ? 'loginRequired' : error.status === 403 ? 'adminForbidden' : 'error'
      ),
    });
  }

  signOut(): void {
    this.session.set(null);
    this.auth.logout();
  }
}
