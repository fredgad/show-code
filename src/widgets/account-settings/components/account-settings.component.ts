import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom, Observable, Subscription, filter } from 'rxjs';
import { TextDirective } from '@shared/directives';
import { AvatarComponent } from '@features';
import { AuthService, ConfirmPopupService, LangService, NotificationService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { LangTextI, StoreUserIN } from '@shared/interfaces';
import { LOGOUT_POPUP_TEXT } from '@shared/constants';

@Component({
  selector: 'org-account-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TextDirective, AvatarComponent],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountSettingsComponent implements OnInit, OnDestroy {
  private formBuilder = inject(FormBuilder);
  private confirmPopupService = inject(ConfirmPopupService);
  private langService = inject(LangService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private appStoreFacade = inject(AppStoreFacade);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private subscription = new Subscription();
  private popupText = this.langService.textByLanguage(LOGOUT_POPUP_TEXT);
  private copySuccessText = this.langService.textByLanguage({
    ENG: 'Key ID copied',
    ESP: 'Key ID copiado',
    RUS: 'Key ID скопирован'
  });
  private copyErrorText = this.langService.textByLanguage({
    ENG: 'Unable to copy Key ID',
    ESP: 'No se pudo copiar el Key ID',
    RUS: 'Не удалось скопировать Key ID'
  });

  public userData$: Observable<StoreUserIN> = this.appStoreFacade.userData$;

  public usernameForm = this.formBuilder.group({
    newUsername: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]+$/)]]
  });
  public emailForm = this.formBuilder.group({
    newEmail: ['', [Validators.required, Validators.email]]
  });
  public passwordForm = this.formBuilder.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  public image: string | ArrayBuffer | null | undefined = null;
  public fileName = 'Файл не выбран';
  public usernameErrorMessage = '';
  public emailErrorMessage = '';
  public currentPasswordErrorMessage = '';
  public passwordErrorMessage = '';
  public isUsernameSubmitting = false;
  public isEmailSubmitting = false;
  public isPasswordSubmitting = false;

  public ngOnInit(): void {
    this.appStoreFacade.getUserData();

    this.subscription.add(
      this.userData$.subscribe(userData => {
        if (!this.usernameForm.dirty) {
          this.usernameForm.patchValue({ newUsername: userData?.username ?? '' }, { emitEvent: false });
        }

        if (!this.emailForm.dirty) {
          this.emailForm.patchValue({ newEmail: userData?.email ?? '' }, { emitEvent: false });
        }
      })
    );
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

        if (typeof this.image === 'string') {
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

  public async submitUsername(currentUsername?: string | null): Promise<void> {
    if (this.isUsernameSubmitting) {
      return;
    }

    this.usernameErrorMessage = '';

    const newUsername = String(this.usernameForm.get('newUsername')?.value ?? '').trim();

    if (!newUsername) {
      this.usernameErrorMessage = this.translate({
        ENG: 'Enter a new login',
        ESP: 'Introduce un nuevo usuario',
        RUS: 'Введите новый логин'
      });
      return;
    }

    if (newUsername.length < 4 || newUsername.length > 20) {
      this.usernameErrorMessage = this.translate({
        ENG: 'Login must be 4-20 characters long',
        ESP: 'El usuario debe tener entre 4 y 20 caracteres',
        RUS: 'Логин должен быть длиной от 4 до 20 символов'
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      this.usernameErrorMessage = this.translate({
        ENG: 'Use only letters, numbers and underscore',
        ESP: 'Usa solo letras, números y guion bajo',
        RUS: 'Используйте только буквы, цифры и нижнее подчёркивание'
      });
      return;
    }

    if (newUsername === (currentUsername ?? '')) {
      this.usernameErrorMessage = this.translate({
        ENG: 'This login already matches the current one',
        ESP: 'Este usuario ya coincide con el actual',
        RUS: 'Этот логин уже совпадает с текущим'
      });
      return;
    }

    this.isUsernameSubmitting = true;

    try {
      const response = await firstValueFrom(this.authService.changeUsername(newUsername));
      this.notificationService.show(
        response?.message ||
          this.translate({
            ENG: 'Login updated',
            ESP: 'Usuario actualizado',
            RUS: 'Логин обновлён'
          })
      );
      this.usernameForm.markAsPristine();
      this.appStoreFacade.getUserData();
    } catch (error) {
      this.usernameErrorMessage = this.extractErrorMessage(
        error,
        this.translate({
          ENG: 'Unable to update login',
          ESP: 'No se pudo actualizar el usuario',
          RUS: 'Не удалось обновить логин'
        })
      );
    } finally {
      this.isUsernameSubmitting = false;
    }
  }

  public async submitEmail(currentEmail?: string | null): Promise<void> {
    if (this.isEmailSubmitting) {
      return;
    }

    this.emailErrorMessage = '';

    const newEmail = String(this.emailForm.get('newEmail')?.value ?? '').trim();

    if (!newEmail) {
      this.emailErrorMessage = this.translate({
        ENG: 'Enter a new email',
        ESP: 'Introduce un nuevo correo',
        RUS: 'Введите новый email'
      });
      return;
    }

    if (!newEmail.includes('@')) {
      this.emailErrorMessage = this.translate({
        ENG: 'Enter a valid email address',
        ESP: 'Introduce un correo válido',
        RUS: 'Введите корректный email'
      });
      return;
    }

    if (newEmail === (currentEmail ?? '')) {
      this.emailErrorMessage = this.translate({
        ENG: 'This email already matches the current one',
        ESP: 'Este correo ya coincide con el actual',
        RUS: 'Этот email уже совпадает с текущим'
      });
      return;
    }

    this.isEmailSubmitting = true;

    try {
      const response = await firstValueFrom(this.authService.changeEmail(newEmail));
      this.notificationService.show(
        response?.message ||
          this.translate({
            ENG: 'Verification email sent to the new address',
            ESP: 'Correo de verificación enviado a la nueva dirección',
            RUS: 'Письмо для подтверждения отправлено на новый адрес'
          }),
        4000
      );
      this.emailForm.patchValue({ newEmail: currentEmail ?? '' });
      this.emailForm.markAsPristine();
    } catch (error) {
      this.emailErrorMessage = this.extractErrorMessage(
        error,
        this.translate({
          ENG: 'Unable to update email',
          ESP: 'No se pudo actualizar el correo',
          RUS: 'Не удалось обновить email'
        })
      );
    } finally {
      this.isEmailSubmitting = false;
    }
  }

  public async submitPassword(): Promise<void> {
    if (this.isPasswordSubmitting) {
      return;
    }

    this.currentPasswordErrorMessage = '';
    this.passwordErrorMessage = '';

    const currentPassword = String(this.passwordForm.get('currentPassword')?.value ?? '');
    const newPassword = String(this.passwordForm.get('newPassword')?.value ?? '');
    const confirmPassword = String(this.passwordForm.get('confirmPassword')?.value ?? '');

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.passwordErrorMessage = this.translate({
        ENG: 'Fill in all password fields',
        ESP: 'Completa todos los campos de contraseña',
        RUS: 'Заполните все поля пароля'
      });
      return;
    }

    if (newPassword.length < 8) {
      this.passwordErrorMessage = this.translate({
        ENG: 'New password must contain at least 8 characters',
        ESP: 'La nueva contraseña debe tener al menos 8 caracteres',
        RUS: 'Новый пароль должен содержать минимум 8 символов'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      this.passwordErrorMessage = this.translate({
        ENG: 'New passwords do not match',
        ESP: 'Las nuevas contraseñas no coinciden',
        RUS: 'Новые пароли не совпадают'
      });
      return;
    }

    this.isPasswordSubmitting = true;

    try {
      const response = await firstValueFrom(this.authService.changePassword(currentPassword, newPassword));
      this.notificationService.show(
        response?.message ||
          this.translate({
            ENG: 'Password updated',
            ESP: 'Contraseña actualizada',
            RUS: 'Пароль обновлён'
          })
      );
      this.passwordForm.reset();
      this.passwordForm.markAsPristine();
    } catch (error) {
      const message = this.extractErrorMessage(
        error,
        this.translate({
          ENG: 'Unable to update password',
          ESP: 'No se pudo actualizar la contraseña',
          RUS: 'Не удалось обновить пароль'
        })
      );

      if (/current password/i.test(message) || /Текущий пароль/i.test(message)) {
        this.currentPasswordErrorMessage = message;
      } else {
        this.passwordErrorMessage = message;
      }
    } finally {
      this.isPasswordSubmitting = false;
    }
  }

  public async copyKeyId(keyId?: string | null): Promise<void> {
    if (!keyId) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(keyId);
      } else {
        this.copyByTextarea(keyId);
      }

      this.notificationService.show(this.copySuccessText());
    } catch {
      this.notificationService.showError(this.copyErrorText());
    }
  }

  public logout(): void {
    this.subscription.add(
      this.confirmPopupService
        .showPopup(this.popupText())
        .pipe(filter(Boolean))
        .subscribe(() => {
          this.appStoreFacade.logout();
        })
    );
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private copyByTextarea(value: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  private translate(text: LangTextI): string {
    return text[this.langService.getLang$i()];
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return String(error.error?.error || error.message || fallback);
    }

    if (typeof error === 'object' && error && 'error' in error) {
      const nestedError = (error as { error?: { error?: string } }).error?.error;
      if (nestedError) {
        return nestedError;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
