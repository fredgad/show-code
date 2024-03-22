import { Component, EventEmitter, Input, Output, WritableSignal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { ConfirmPopupService } from '@shared/services';
import { Observable } from 'rxjs';

@Component({
  selector: 'org-confirm-popup',
  standalone: true,
  imports: [CommonModule, TextDirective],
  templateUrl: './confirm-popup.component.html',
  styleUrl: './confirm-popup.component.scss',
})
export class ConfirmPopupComponent {
  private confirmService = inject(ConfirmPopupService);

  public message$: Observable<string> = this.confirmService.message$;
  public isVisible$: Observable<boolean> = this.confirmService.isVisible$;

  public confirm(): void {
    this.confirmService.setVisibility(false);
    this.confirmService.setConfirm(true);
  }

  public decline(): void {
    this.confirmService.setVisibility(false);
    this.confirmService.setConfirm(false);
  }
}
