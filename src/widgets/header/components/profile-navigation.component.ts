import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, Input, Output, PLATFORM_ID, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LOGOUT_POPUP_TEXT } from '@shared/constants';
import { LangTextI } from '@shared/interfaces';
import { AuthService, ConfirmPopupService, LangService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { AdminApiService } from '../../../pages/admin/admin-api.service';
import { PROFILE_NAVIGATION } from '../../../pages/profile/profile-navigation';
import { PROFILE_TEXT } from '../../../pages/profile/profile.text';

@Component({
  selector: 'org-profile-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './profile-navigation.component.html',
  styleUrl: './profile-navigation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.in-menu]': 'inMenu' }
})
export class ProfileNavigationComponent {
  private readonly language = inject(LangService);
  private readonly store = inject(AppStoreFacade);
  private readonly confirmPopup = inject(ConfirmPopupService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private readonly adminApi = inject(AdminApiService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  @Input() inMenu = false;
  @Output() readonly actionSelected = new EventEmitter<void>();

  readonly copy = PROFILE_TEXT;
  readonly profile = PROFILE_NAVIGATION.profile;
  readonly profileMatch = { paths: 'exact', queryParams: 'ignored', matrixParams: 'ignored', fragment: 'ignored' } as const;
  private readonly canOpenAdmin = toSignal(this.store.token$.pipe(
    switchMap(token => {
      if (!this.browser || token === null || !this.auth.isLoggedIn()) return of(false);
      return this.adminApi.session().pipe(
        map(({ admin }) => admin?.permissions?.billing === true),
        catchError(() => of(false)),
        startWith(false)
      );
    })
  ), { initialValue: false });

  readonly groups = computed(() => [
    { title: null, items: this.canOpenAdmin() ? [this.profile, PROFILE_NAVIGATION.admin] : [this.profile] },
    { title: this.copy.media, items: [PROFILE_NAVIGATION.vault, PROFILE_NAVIGATION.capture] },
    { title: this.copy.account, items: [
      PROFILE_NAVIGATION.billing,
      PROFILE_NAVIGATION.trustedPeople,
      PROFILE_NAVIGATION.notifications,
      PROFILE_NAVIGATION.settings
    ] }
  ]);

  text(label: LangTextI): string {
    return this.language.resolveText(label);
  }

  signOut(): void {
    this.actionSelected.emit();
    this.confirmPopup.showPopup(this.text(LOGOUT_POPUP_TEXT))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) this.store.logout();
      });
  }
}
