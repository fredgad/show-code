import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from '@features';
import { copyText } from '@shared/helpers';
import { LangTextI } from '@shared/interfaces';
import { LangService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { PROFILE_NAVIGATION } from '../profile-navigation';
import { PROFILE_TEXT } from '../profile.text';

@Component({
  selector: 'org-profile-overview',
  standalone: true,
  imports: [AvatarComponent, RouterLink],
  templateUrl: './profile-overview.component.html',
  styleUrl: './profile-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileOverviewComponent {
  private readonly store = inject(AppStoreFacade);
  private readonly langService = inject(LangService);
  private readonly document = inject(DOCUMENT);

  public readonly user = toSignal(this.store.userData$);
  public readonly loadStatus = toSignal(this.store.userLoadStatus$);
  public readonly copyFeedback = signal<'copied' | 'copyError' | null>(null);
  public readonly copy = PROFILE_TEXT;
  public readonly links = PROFILE_NAVIGATION;

  public text(label: LangTextI): string {
    return this.langService.resolveText(label);
  }

  public reload(): void {
    this.store.getUserData();
  }

  public async copyKeyId(keyId: string): Promise<void> {
    this.copyFeedback.set(null);
    try {
      await copyText(this.document, keyId);
      this.copyFeedback.set('copied');
    } catch {
      this.copyFeedback.set('copyError');
    }
  }
}
