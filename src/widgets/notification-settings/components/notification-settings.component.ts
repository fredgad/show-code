import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { LangService } from '@shared/services';
import { INPUT_PLACEHOLDER } from '../common/notification-settings.text';

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

  public inputPlaceholder$i: Signal<string> = this.langService.textByLanguage(INPUT_PLACEHOLDER);
  
  public tags: string[] = [];


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
