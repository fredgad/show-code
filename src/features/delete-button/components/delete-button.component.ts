import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmPopupService, LangService } from '@shared/services';
import { Subscription } from 'rxjs';
import { POPUP_TEXT } from '../common/delete-button.text';

@Component({
  selector: 'org-delete-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-button.component.html',
  styleUrl: './delete-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeleteButtonComponent implements OnDestroy {
  private confirmService = inject(ConfirmPopupService);
  private langService = inject(LangService);

  @Output() delete = new EventEmitter<boolean>();

  private subscription?: Subscription;

  private popupText = this.langService.textByLanguage(POPUP_TEXT);

  public onDel(): void {
    this.subscription = this.confirmService.showPopup(this.popupText()).subscribe(confirm => {
      this.delete.emit(confirm);
    });
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
