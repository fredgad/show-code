import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LangService } from '@shared/services';
import { HeaderComponent } from '@widgets/header';
import { AccountSettingsComponent } from '@widgets/account-settings';
import { PROFILE_TEXT } from '../../profile/profile.text';

@Component({
  selector: 'org-settings',
  standalone: true,
  imports: [HeaderComponent, AccountSettingsComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  readonly support = inject(LangService).textByLanguage(PROFILE_TEXT.support);
}
