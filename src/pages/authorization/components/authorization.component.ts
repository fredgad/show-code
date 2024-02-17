import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@widgets/header';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LangService, UserNameService } from '@shared/services';
import { getFormControlErrorMessage, isValidFormControl } from '@shared/helpers';
import { LangEnum } from '@shared/interfaces';

@Component({
  selector: 'org-authorization',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ReactiveFormsModule],
  templateUrl: './authorization.component.html',
  styleUrl: './authorization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationComponent {
  private formBuilder = inject(FormBuilder);
  private userNameService = inject(UserNameService);
  private langService = inject(LangService);
  
  @ViewChild('password') private password!: ElementRef<HTMLInputElement>;
  
  public userName$i = this.userNameService.getUserName;
  
  public language!: LangEnum;

  public authForm: FormGroup;
  public isSubmited = false;

  constructor() {
    this.authForm =  this.formBuilder.group({
      login: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    effect(() => {
      this.language = this.langService.getLang$i();
    });
  }

  public ngOnInit() {

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
      // alert('Please fill in all the required fields correctly.');
      
    }
  }

  public isValidControl(controlName: string): boolean {
    return isValidFormControl(controlName, this.authForm, this.isSubmited);
  }

  public getErrorMessage(controlName: string): string | null {
    return getFormControlErrorMessage(controlName, this.authForm, this.language)
  }
}
