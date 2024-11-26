import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, filter } from 'rxjs';
import { HeaderComponent } from '@widgets/header';
import { FooterComponent } from '@widgets/footer';
import { ImageDirective, TextDirective } from '@shared/directives';
import { CheckboxComponent } from '@features/checkbox';
import { ImageModalComponent } from '@features/image-modal';
import { ConfirmPopupService, LangService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { StoreUserIN } from '@shared/interfaces';
import { LOGOUT_POPUP_TEXT } from '@shared/constants';

@Component({
  selector: 'org-settings',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TextDirective, CheckboxComponent, ImageDirective, FooterComponent, ImageModalComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnDestroy {
  private confirmPopupService = inject(ConfirmPopupService);
  private langService = inject(LangService);
  private cdr = inject(ChangeDetectorRef);
  private appStoreFacade = inject(AppStoreFacade);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private subscription?: Subscription;
  private popupText = this.langService.textByLanguage(LOGOUT_POPUP_TEXT);

  public userData$: Observable<StoreUserIN> = this.appStoreFacade.userData$;

  public image: string | ArrayBuffer | null | undefined = null;
  public fileName = 'Файл не выбран';

  public ngOnInit(): void {
    this.appStoreFacade.getUserData();
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file: File = input.files[0];
      this.fileName = file.name;

      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.image = e.target?.result;
        this.cdr.markForCheck();

        // Save avatar to server
        if (typeof this.image === 'string') {
          console.log('typeof this.image === string', this.fileName);
          this.appStoreFacade.saveImage(this.image);
        }
      };

      reader.readAsDataURL(file);
    } else {
      this.fileName = 'Файл не выбран';
    }
  }

  public triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  public logout() {
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
