import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, WritableSignal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '@widgets/header';
import { LangService, UserNameService, AuthService } from '@shared/services';
import { getFormControlErrorMessage, isValidFormControl } from '@shared/helpers';
import { LangEnum } from '@shared/interfaces';
import { TextDirective } from '@shared/directives';
import { AppStoreFacade } from '@store';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'org-authorization',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, TextDirective, RouterModule],
  templateUrl: './authorization.component.html',
  styleUrl: './authorization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthorizationComponent implements AfterViewInit {
  private formBuilder = inject(FormBuilder);
  private userNameService = inject(UserNameService);
  private langService = inject(LangService);
  private authService = inject(AuthService);
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

  public ngAfterViewInit(): void {
    if (this.userName$i()) {
      this.authForm.patchValue({ login: this.userName$i() });
      this.password.nativeElement.focus();
    }
  }

  public onSubmit(): void {
    if (this.authForm.valid) {
      const userValue = {
        login: this.authForm.value.login,
        password: this.authForm.value.password
      };

      console.log('Authhorization data:', userValue);
      this.appStoreFacade.auth(userValue);

      // this.authService.getUsers().subscribe((users) => {
      //   console.log(users, 'getUsers users')
      //   this.authForm.reset();
      //   this.authForm.markAsUntouched();
      // });
    } else {
      // Display an error message or take appropriate action for invalid form
      this.isSubmited = true;
      console.log(this.authForm.value, this.authForm.get('email'), 'registrationForm');
    }
  }

  public isValidControl(controlName: string): boolean {
    return isValidFormControl(controlName, this.authForm, this.isSubmited);
  }

  public getErrorMessage(controlName: string): string | null {
    return getFormControlErrorMessage(controlName, this.authForm, this.language);
  }
}
