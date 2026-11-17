import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { AvatarComponent } from '@features';
import { copyText } from '@shared/helpers';
import { LangTextI } from '@shared/interfaces';
import { AuthService, LangService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { PROFILE_NAVIGATION } from '../../../pages/profile/profile-navigation';
import { PROFILE_TEXT } from '../../../pages/profile/profile.text';
import { ACCOUNT_SETTINGS_TEXT } from './account-settings.text';

interface Feedback {
  kind: 'error' | 'success';
  message: LangTextI | string;
}

@Component({
  selector: 'org-account-settings',
  standalone: true,
  imports: [NgTemplateOutlet, ReactiveFormsModule, RouterLink, AvatarComponent],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountSettingsComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly store = inject(AppStoreFacade);
  private readonly language = inject(LangService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly copy = ACCOUNT_SETTINGS_TEXT;
  readonly profile = PROFILE_TEXT;
  readonly title = PROFILE_NAVIGATION.settings.label;

  readonly user = toSignal(this.store.userData$.pipe(
    map(user => user.username || user.email || user.keyId ? user : null)
  ));
  readonly loadStatus = toSignal(this.store.userLoadStatus$);
  readonly copyFeedback = signal<'copied' | 'copyError' | null>(null);
  readonly avatarFeedback = signal<Feedback | null>(null);
  readonly usernameFeedback = signal<Feedback | null>(null);
  readonly emailFeedback = signal<Feedback | null>(null);
  readonly passwordFeedback = signal<Feedback | null>(null);
  readonly savingAvatar = signal(false);
  readonly savingUsername = signal(false);
  readonly savingEmail = signal(false);
  readonly savingPassword = signal(false);
  readonly showPasswords = signal(false);
  readonly identityBusy = computed(() => this.savingAvatar() || this.savingUsername() || this.loadStatus() === 'loading');

  readonly deletionDelay = computed(() => {
    const minutes = this.user()?.videoDeletionDelayMinutes;
    if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0) return null;
    if (minutes === 0) return this.text(this.copy.immediateDeletion);

    if (minutes % 1440 === 0) return this.formatDuration(minutes / 1440, 'day');
    if (minutes % 60 === 0) return this.formatDuration(minutes / 60, 'hour');
    return this.formatDuration(minutes, 'minute');
  });

  readonly usernameForm = this.formBuilder.group({
    newUsername: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(20), Validators.pattern(/^[a-zA-Z0-9_]+$/)]]
  });

  readonly emailForm = this.formBuilder.group({
    newEmail: ['', [Validators.required, Validators.email]]
  });

  readonly passwordForm = this.formBuilder.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  ngOnInit(): void {
    this.store.userData$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      if (this.usernameForm.pristine) this.usernameForm.controls.newUsername.setValue(user.username ?? '', { emitEvent: false });
      if (this.emailForm.pristine) this.emailForm.controls.newEmail.setValue(user.email ?? '', { emitEvent: false });
    });

    this.store.getUserData();
  }

  text(label: LangTextI | string): string {
    return typeof label === 'string' ? label : this.language.resolveText(label);
  }

  reload(): void {
    this.store.getUserData(true);
  }

  async selectPhoto(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.identityBusy()) return;

    if (file.type && !file.type.startsWith('image/')) {
      this.avatarFeedback.set({ kind: 'error', message: this.copy.photoInvalid });
      return;
    }

    this.savingAvatar.set(true);
    this.avatarFeedback.set(null);
    try {
      const image = await this.readPhoto(file);
      await firstValueFrom(this.auth.saveImage(image).pipe(takeUntilDestroyed(this.destroyRef)));
      this.store.getUserData(true);
      this.avatarFeedback.set({ kind: 'success', message: this.copy.photoSaved });
    } catch (error) {
      this.avatarFeedback.set({
        kind: 'error',
        message: error instanceof HttpErrorResponse && error.status === 413 ? this.copy.photoTooLarge : this.copy.photoFailed
      });
    } finally {
      this.savingAvatar.set(false);
    }
  }

  async submitUsername(currentUsername: string | null): Promise<void> {
    if (this.identityBusy()) return;

    const control = this.usernameForm.controls.newUsername;
    const username = control.value.trim();
    control.setValue(username);
    if (username === (currentUsername ?? '')) return;

    if (control.invalid) {
      this.usernameFeedback.set({ kind: 'error', message: this.copy.usernameInvalid });
      return;
    }

    this.savingUsername.set(true);
    this.usernameFeedback.set(null);
    try {
      const response = await firstValueFrom(this.auth.changeUsername(username).pipe(takeUntilDestroyed(this.destroyRef)));
      this.usernameForm.reset({ newUsername: response?.username ?? username });
      this.store.getUserData(true);
      this.usernameFeedback.set({ kind: 'success', message: this.copy.usernameSaved });
    } catch (error) {
      this.usernameFeedback.set({ kind: 'error', message: this.apiError(error, this.copy.usernameFailed) });
    } finally {
      this.savingUsername.set(false);
    }
  }

  async submitEmail(currentEmail: string | null): Promise<void> {
    if (this.savingEmail()) return;

    const control = this.emailForm.controls.newEmail;
    const email = control.value.trim();
    control.setValue(email);
    if (email.toLowerCase() === (currentEmail ?? '').toLowerCase()) return;

    if (control.invalid) {
      this.emailFeedback.set({ kind: 'error', message: this.copy.emailInvalid });
      return;
    }

    this.savingEmail.set(true);
    this.emailFeedback.set(null);
    try {
      await firstValueFrom(this.auth.changeEmail(email).pipe(takeUntilDestroyed(this.destroyRef)));
      this.emailForm.reset({ newEmail: currentEmail ?? '' });
      this.emailFeedback.set({ kind: 'success', message: this.copy.emailSent });
    } catch (error) {
      this.emailFeedback.set({ kind: 'error', message: this.apiError(error, this.copy.emailFailed) });
    } finally {
      this.savingEmail.set(false);
    }
  }

  async submitPassword(): Promise<void> {
    if (this.savingPassword()) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (this.passwordForm.invalid || newPassword !== confirmPassword) {
      this.passwordForm.markAllAsTouched();
      let message = this.copy.passwordMismatch;
      if (!currentPassword || !newPassword || !confirmPassword) message = this.copy.passwordRequired;
      else if (this.passwordForm.controls.newPassword.invalid) message = this.copy.passwordHint;
      this.passwordFeedback.set({ kind: 'error', message });
      return;
    }

    this.savingPassword.set(true);
    this.passwordFeedback.set(null);
    try {
      await firstValueFrom(this.auth.changePassword(currentPassword, newPassword).pipe(takeUntilDestroyed(this.destroyRef)));
      this.passwordForm.reset();
      this.showPasswords.set(false);
      this.passwordFeedback.set({ kind: 'success', message: this.copy.passwordSaved });
    } catch (error) {
      this.passwordFeedback.set({ kind: 'error', message: this.apiError(error, this.copy.passwordFailed) });
    } finally {
      this.savingPassword.set(false);
    }
  }

  async copyKeyId(keyId: string): Promise<void> {
    try {
      await copyText(this.document, keyId);
      this.copyFeedback.set('copied');
    } catch {
      this.copyFeedback.set('copyError');
    }
  }

  signOut(dialog: HTMLDialogElement): void {
    dialog.close();
    this.store.logout();
  }

  private readPhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reader.onabort = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private formatDuration(value: number, unit: 'day' | 'hour' | 'minute'): string {
    return new Intl.NumberFormat(this.text(this.copy.locale), { style: 'unit', unit, unitDisplay: 'long' }).format(value);
  }

  private apiError(error: unknown, fallback: LangTextI): LangTextI | string {
    if (error instanceof HttpErrorResponse && error.status < 500 && typeof error.error?.error === 'string') {
      return error.error.error;
    }
    return fallback;
  }
}
