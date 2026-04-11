import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@widgets/header';
import { FooterComponent } from '@widgets/footer';
import { AccountSettingsComponent } from '@widgets/account-settings';

@Component({
  selector: 'org-settings',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, AccountSettingsComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {}
