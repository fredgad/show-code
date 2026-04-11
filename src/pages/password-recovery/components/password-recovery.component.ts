import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { HeaderComponent } from '@widgets/header';
import { TextDirective } from '@shared/directives';
import { LangTextI } from '@shared/interfaces';
import { AuthService, LangService, NotificationService } from '@shared/services';

type RecoveryStep = 'email' | 'code' | 'password';

@Component({
  selector: 'org-password-recovery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HeaderComponent, TextDirective],
  templateUrl: './password-recovery.component.html',
  styleUrl: './password-recovery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page'
  }
})
export class PasswordRecoveryComponent {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private langService = inject(LangService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  public currentStep: RecoveryStep = 'email';
  public recoveryEmail = '';
  public isSubmitting = false;
  public errorMessage = '';

  public emailForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]]
  });

  public codeForm = this.formBuilder.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
  });

  public resetForm = this.formBuilder.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  constructor() {
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email')?.trim();

    if (emailFromQuery) {
      this.emailForm.patchValue({ email: emailFromQuery });
    }
  }

  public get currentStepIndex(): number {
    switch (this.currentStep) {
      case 'code':
        return 1;
      case 'password':
        return 2;
      default:
        return 0;
    }
  }

  public async submitEmail(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';

    const email = String(this.emailForm.get('email')?.value ?? '').trim();

    if (!email || !email.includes('@')) {
      this.errorMessage = this.translate({
        ENG: 'Enter a valid email address',
        ESP: 'Introduce un correo válido',
        RUS: 'Введите корректный email'
      });
      return;
    }

    this.isSubmitting = true;

    try {
      const response = await firstValueFrom(this.authService.sendRecoveryCode(email));
      this.recoveryEmail = email;
      this.currentStep = 'code';
      this.errorMessage = '';
      this.codeForm.reset();
      this.resetForm.reset();
      this.cdr.markForCheck();
      this.notificationService.show(
        response?.message ||
          this.translate({
            ENG: 'Verification code sent',
            ESP: 'Código de verificación enviado',
            RUS: 'Код подтверждения отправлен'
          }),
        3500
      );
    } catch (error) {
      this.errorMessage = this.resolveRecoveryErrorMessage(error, 'send');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  public async submitCode(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';

    const email = this.recoveryEmail || String(this.emailForm.get('email')?.value ?? '').trim();
    const code = String(this.codeForm.get('code')?.value ?? '').trim();

    if (!email) {
      this.currentStep = 'email';
      return;
    }

    if (!/^\d{4}$/.test(code)) {
      this.errorMessage = this.translate({
        ENG: 'Enter the 4-digit code from the email',
        ESP: 'Introduce el código de 4 dígitos del correo',
        RUS: 'Введите 4-значный код из письма'
      });
      return;
    }

    this.isSubmitting = true;

    try {
      await firstValueFrom(this.authService.verifyRecoveryCode(email, code));
      this.currentStep = 'password';
      this.errorMessage = '';
      this.cdr.markForCheck();
    } catch (error) {
      this.errorMessage = this.resolveRecoveryErrorMessage(error, 'verify');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  public async submitPassword(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';

    const email = this.recoveryEmail || String(this.emailForm.get('email')?.value ?? '').trim();
    const code = String(this.codeForm.get('code')?.value ?? '').trim();
    const newPassword = String(this.resetForm.get('newPassword')?.value ?? '');
    const confirmPassword = String(this.resetForm.get('confirmPassword')?.value ?? '');

    if (!email || !code) {
      this.currentStep = 'email';
      return;
    }

    if (newPassword.length < 8) {
      this.errorMessage = this.translate({
        ENG: 'New password must contain at least 8 characters',
        ESP: 'La nueva contraseña debe tener al menos 8 caracteres',
        RUS: 'Новый пароль должен содержать минимум 8 символов'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      this.errorMessage = this.translate({
        ENG: 'Passwords do not match',
        ESP: 'Las contraseñas no coinciden',
        RUS: 'Пароли не совпадают'
      });
      return;
    }

    this.isSubmitting = true;

    try {
      await firstValueFrom(this.authService.resetRecoveredPassword(email, code, newPassword));
      await this.router.navigate(['/auth'], {
        queryParams: {
          login: email,
          recovered: '1'
        }
      });
    } catch (error) {
      this.errorMessage = this.resolveRecoveryErrorMessage(error, 'reset');
    } finally {
      this.isSubmitting = false;
      this.cdr.markForCheck();
    }
  }

  public returnToEmailStep(): void {
    this.errorMessage = '';
    this.currentStep = 'email';
    this.cdr.markForCheck();
  }

  public translate(text: LangTextI): string {
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

  private resolveRecoveryErrorMessage(error: unknown, type: 'send' | 'verify' | 'reset'): string {
    const backendMessage = this.extractErrorMessage(error, '').trim();

    if (backendMessage && !(error instanceof HttpErrorResponse && backendMessage === error.message)) {
      return backendMessage;
    }

    if (error instanceof HttpErrorResponse && error.status === 404) {
      return this.translate({
        ENG: 'No account with this email was found',
        ESP: 'No se encontró una cuenta con este correo',
        RUS: 'Аккаунт с таким email не найден'
      });
    }

    if (type === 'send') {
      return this.translate({
        ENG: 'Unable to send code',
        ESP: 'No se pudo enviar el código',
        RUS: 'Не удалось отправить код'
      });
    }

    if (type === 'verify') {
      return this.translate({
        ENG: 'Invalid or expired code',
        ESP: 'Código inválido o caducado',
        RUS: 'Неверный или просроченный код'
      });
    }

    return this.translate({
      ENG: 'Unable to reset password',
      ESP: 'No se pudo restablecer la contraseña',
      RUS: 'Не удалось сбросить пароль'
    });
  }
}
