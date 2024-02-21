import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'org-notification-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationSettingsComponent {}
