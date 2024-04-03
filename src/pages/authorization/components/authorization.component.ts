import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, WritableSignal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@widgets/header';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LangService, UserNameService } from '@shared/services';
import { getFormControlErrorMessage, isValidFormControl } from '@shared/helpers';
import { LangEnum } from '@shared/interfaces';
import { TextDirective } from '@shared/directives';

@Component({
  selector: 'org-authorization',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule, TextDirective],
  templateUrl: './authorization.component.html',
  styleUrl: './authorization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationComponent implements AfterViewInit {
  private formBuilder = inject(FormBuilder);
  private userNameService = inject(UserNameService);
  private langService = inject(LangService);
  
  @ViewChild('password') private password!: ElementRef<HTMLInputElement>;
  
  public userName$i: WritableSignal<string> = this.userNameService.getUserName;
  
  public language!: LangEnum;
  public authForm: FormGroup;
  public isSubmited = false;

  constructor() {
    this.authForm =  this.formBuilder.group({
      login: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    effect(() => { // the way to get signal value of current language for forms
      this.language = this.langService.getLang$i();
    });
  }

  public ngAfterViewInit(): void {
    if (this.userName$i()) {
      this.password.nativeElement.focus();
    }
  }

  public onSubmit(): void {
    if (this.authForm.valid) {
      const formData = this.authForm.value;
      console.log('Registration data:', formData);
      // Reset the form after successful registration
      // this.registrationForm.reset();
      // this.registrationForm.markAsUntouched();
    } else {
      // Display an error message or take appropriate action for invalid form
      this.isSubmited = true;
      console.log(this.authForm.value, this.authForm.get('email'), 'registrationForm')
    }
  }

  public isValidControl(controlName: string): boolean {
    return isValidFormControl(controlName, this.authForm, this.isSubmited);
  }

  public getErrorMessage(controlName: string): string | null {
    return getFormControlErrorMessage(controlName, this.authForm, this.language)
  }
}
