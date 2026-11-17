import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, WritableSignal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '@widgets/header';
import { LangService, UserNameService, NotificationService } from '@shared/services';
import { getFormControlErrorMessage, isValidFormControl } from '@shared/helpers';
import { LangEnum } from '@shared/interfaces';
import { TextDirective } from '@shared/directives';
import { AppStoreFacade } from '@store';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'org-authorization',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, TextDirective, RouterModule],
  templateUrl: './authorization.component.html',
  styleUrl: './authorization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthorizationComponent implements OnInit, AfterViewInit {
  private formBuilder = inject(FormBuilder);
  private userNameService = inject(UserNameService);
  private langService = inject(LangService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appStoreFacade = inject(AppStoreFacade);

  @ViewChild('password') private password!: ElementRef<HTMLInputElement>;

  public userName$i: WritableSignal<string> = this.userNameService.getUserName;

  public language!: LangEnum;
  public authForm: FormGroup;
  public isSubmited = false;

  constructor() {
    this.authForm = this.formBuilder.group({
      login: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    effect(() => {
      // the way to get signal value of current language for forms
      this.language = this.langService.getLang$i();
    });
  }

  public ngOnInit(): void {
    const loginFromQuery = this.route.snapshot.queryParamMap.get('login')?.trim();

    if (loginFromQuery) {
      this.authForm.patchValue({ login: loginFromQuery });
    }

    if (this.route.snapshot.queryParamMap.get('recovered') === '1') {
      this.notificationService.show(
        this.langService.textByLanguage({
          ENG: 'Password updated. Sign in with the new password.',
          ESP: 'Contraseña actualizada. Inicia sesión con la nueva contraseña.',
          RUS: 'Пароль обновлён. Войдите с новым паролем.'
        })(),
        4000
      );

      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { recovered: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

  public ngAfterViewInit(): void {
    if (!this.authForm.get('login')?.value && this.userName$i()) {
      this.authForm.patchValue({ login: this.userName$i() });
      this.password.nativeElement.focus();
      return;
    }

    this.password.nativeElement.focus();
  }

  public onSubmit(): void {
    if (this.authForm.valid) {
      const userValue = {
        login: this.authForm.value.login,
        password: this.authForm.value.password
      };

      this.appStoreFacade.auth(userValue);

      // this.authService.getUsers().subscribe((users) => {
      //   console.log(users, 'getUsers users')
      //   this.authForm.reset();
      //   this.authForm.markAsUntouched();
      // });
    } else {
      // Display an error message or take appropriate action for invalid form
      this.isSubmited = true;
    }
  }

  public isValidControl(controlName: string): boolean {
    return isValidFormControl(controlName, this.authForm, this.isSubmited);
  }

  public getErrorMessage(controlName: string): string | null {
    return getFormControlErrorMessage(controlName, this.authForm, this.language);
  }

  public get recoveryQueryParams(): { email: string } | null {
    const login = String(this.authForm.get('login')?.value ?? '').trim();

    if (!login || !login.includes('@')) {
      return null;
    }

    return { email: login };
  }
}
