import { Component, OnDestroy, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TextDirective } from '@shared/directives';
import { AuthService, ConfirmPopupService, LangService, UserNameService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { LOGOUT_POPUP_TEXT } from '@shared/constants';
import { INPUT_PLACEHOLDER } from '../../common/main.text';

@Component({
  selector: 'org-main-form',
  standalone: true,
  imports: [CommonModule, TextDirective, FormsModule],
  templateUrl: './main-form.component.html',
  styleUrl: './main-form.component.scss'
})
export class MainFormComponent implements OnDestroy {
  private router = inject(Router);
  private confirmPopupService = inject(ConfirmPopupService);
  private userNameService = inject(UserNameService);
  private langService = inject(LangService);
  private authService = inject(AuthService);
  private appStoreFacade = inject(AppStoreFacade);

  private subscription?: Subscription;
  private popupText = this.langService.textByLanguage(LOGOUT_POPUP_TEXT);

  public inputPlaceholder$i: Signal<string> = this.langService.textByLanguage(INPUT_PLACEHOLDER);

  public isLoggedIn = this.authService.isLoggedIn();
  public userName: string = '';

  public submitUserName(e: Event): void {
    e.preventDefault();
    this.userNameService.setUserName = this.userName;
    this.router.navigate(['/registration']);
  }

  public goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  public goToAuth(userName: string): void {
    this.userNameService.setUserName = this.userName;
    this.router.navigate(['/auth']);
  }

  public logout(): void {
    this.subscription = this.confirmPopupService
      .showPopup(this.popupText())
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.appStoreFacade.logout();
      });
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
