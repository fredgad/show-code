import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { LangTextI } from '@shared/interfaces';
import { LangService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { HeaderComponent, ProfileNavigationComponent } from '@widgets/header';
import { PROFILE_NAVIGATION } from '../profile-navigation';
import { PROFILE_TEXT } from '../profile.text';

@Component({
  selector: 'org-profile',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ProfileNavigationComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  private readonly store = inject(AppStoreFacade);
  private readonly langService = inject(LangService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);

  public readonly copy = PROFILE_TEXT;

  constructor() {
    const previousTitle = this.title.getTitle();
    effect(() => this.title.setTitle(`${this.text(PROFILE_NAVIGATION.profile.label)} — E-stream`));
    this.destroyRef.onDestroy(() => this.title.setTitle(previousTitle));
  }

  public ngOnInit(): void {
    this.store.getUserData();
  }

  public text(label: LangTextI): string {
    return this.langService.resolveText(label);
  }
}
