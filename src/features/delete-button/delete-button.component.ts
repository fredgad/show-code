import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmPopupService, LangService } from '../../shared';
import { Subscription } from 'rxjs';

@Component({
  selector: 'org-delete-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-button.component.html',
  styleUrl: './delete-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteButtonComponent implements OnDestroy {
  private confirmService = inject(ConfirmPopupService);
  private langService = inject(LangService);

  @Output() delete = new EventEmitter<boolean>();

  private confirmSubscription?: Subscription; 

  private popupText = this.langService.textByLanguage({
    ENG: 'Delete trusted user?',
    RUS: 'Удалить доверенного пользователя?',
    ESP: '¿Eliminar usuario de confianza?',
  });

  public onDel(): void {
    this.confirmSubscription = this.confirmService.showPopup(this.popupText()).subscribe((confirm) => {
      this.delete.emit(confirm);
    })
  }
     
  public ngOnDestroy(): void {
    if (this.confirmSubscription) {
      this.confirmSubscription.unsubscribe();
    }
  }
}
