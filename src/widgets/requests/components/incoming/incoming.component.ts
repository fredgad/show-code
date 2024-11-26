import { Component, inject, OnDestroy, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioComponent } from '@features/audio';
import { filter, Observable, Subscription } from 'rxjs';
import { AppStoreFacade } from '@store';
import { TextDirective } from '@shared/directives';
import { ConfirmPopupService, LangService } from '@shared/services';

@Component({
  selector: 'org-incoming',
  standalone: true,
  imports: [CommonModule, AudioComponent, TextDirective],
  templateUrl: './incoming.component.html',
  styleUrl: './incoming.component.scss'
})
export class IncomingComponent implements OnDestroy {
  private appStoreFacade = inject(AppStoreFacade);
  private confirmPopupService = inject(ConfirmPopupService);
  private langService = inject(LangService);

  public incomingReq$: Observable<string[] | null | undefined> = this.appStoreFacade.incomingReq$;

  private subscription?: Subscription;

  public acceptReq(keyId: string): void {
    this.subscription = this.confirmPopupService
      .showPopup(this.acceptReqPopupText(keyId)())
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.appStoreFacade.acceptTrustedUser(keyId);
      });
  }

  public rejectReq(keyId: string): void {
    this.subscription = this.confirmPopupService
      .showPopup(this.rejectReqPopupText(keyId)())
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.appStoreFacade.cancelRequest(keyId);
      });
  }

  private acceptReqPopupText(keyId: string): Signal<string> {
    const languageTexts = {
      ENG: `Do you really want to add a trusted user ${keyId} ?`,
      ESP: `¿Realmente desea agregar un usuario de confianza ${keyId}" ?`,
      RUS: `Вы действительно хотите добавить доверенного пользователя ${keyId} ?`
    };

    return this.langService.textByLanguage(languageTexts);
  }

  private rejectReqPopupText(keyId: string): Signal<string> {
    const languageTexts = {
      ENG: `Do you really want to reject the request to add a trusted user ${keyId} ?`,
      ESP: `¿Realmente desea rechazar la solicitud de agregar un usuario de confianza ${keyId}" ?`,
      RUS: `Вы действительно хотите отклонить запрос на добавление доверенного пользователя ${keyId} ?`
    };

    return this.langService.textByLanguage(languageTexts);
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
