import { Component, inject, OnDestroy, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioComponent } from '@features/audio';
import { AppStoreFacade } from '@store';
import { filter, Observable, Subscription } from 'rxjs';
import { TextDirective } from '@shared/directives';
import { ConfirmPopupService, LangService } from '@shared/services';
import { CANCEL_REQ_POPUP_TEXT } from '../../common/requests.text';
import { LangTextI } from '@shared/interfaces';

@Component({
  selector: 'org-outgoing',
  standalone: true,
  imports: [CommonModule, AudioComponent, TextDirective],
  templateUrl: './outgoing.component.html',
  styleUrl: './outgoing.component.scss'
})
export class OutgoingComponent implements OnDestroy {
  private appStoreFacade = inject(AppStoreFacade);
  private confirmPopupService = inject(ConfirmPopupService);
  private langService = inject(LangService);

  public outgoingReq$: Observable<string[] | null | undefined> = this.appStoreFacade.outgoingReq$;

  private subscription?: Subscription;

  public cancelReq(keyId: string): void {
    this.subscription = this.confirmPopupService
      .showPopup(this.cancelReqPopupText(keyId)())
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.appStoreFacade.cancelRequest(keyId);
      });
  }

  private cancelReqPopupText(keyId: string): Signal<string> {
    const languageTexts = {
      ENG: `Do you really want to cancel the request to add a trusted user ${keyId} ?`,
      ESP: `¿Realmente desea cancelar la solicitud de agregar un usuario de confianza ${keyId}" ?`,
      RUS: `Вы действительно хотите отменить запрос на добавление доверенного пользователя ${keyId} ?`
    };

    return this.langService.textByLanguage(languageTexts);
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
