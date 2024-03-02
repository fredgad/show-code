import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { LangService } from '@shared/services';

@Component({
  selector: 'org-notification-settings',
  standalone: true,
  imports: [CommonModule, TextDirective],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationSettingsComponent {
  private langService = inject(LangService);

  public tags: string[] = [];

  public inputPlaceholder: Signal<string> = this.langService.textByLanguage({
    ENG: 'Enter Email...',
    ESP: 'Ingrese correl...',
    RUS: 'Введите Email...'
  });

  public addTag(event: Event): void {
    const input = event.target as HTMLInputElement
    const value = input.value.trim();
    if (value && !this.tags.includes(value)) {
      this.tags.push(value);
      input.value = '';
    }
  }

  public removeTag(tagToRemove: string): void {
    this.tags = this.tags.filter(tag => tag !== tagToRemove);
  }
}
