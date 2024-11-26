import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { LangService } from '@shared/services';
import { INPUT_PLACEHOLDER } from '../common/requests.text';
import { RouterModule } from '@angular/router';
import { OutgoingComponent } from './outgoing/outgoing.component';
import { IncomingComponent } from './incoming/incoming.component';

@Component({
  selector: 'org-requests',
  standalone: true,
  imports: [CommonModule, TextDirective, RouterModule, OutgoingComponent, IncomingComponent],
  templateUrl: './requests.component.html',
  styleUrl: './requests.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestsComponent {
  private langService = inject(LangService);

  public inputPlaceholder$i: Signal<string> = this.langService.textByLanguage(INPUT_PLACEHOLDER);

  public tags: string[] = [];

  public addTag(event: Event): void {
    const input = event.target as HTMLInputElement;
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
