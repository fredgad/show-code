import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LangService, UserNameService } from '@shared/services';
import { getFormControlErrorMessage, isValidFormControl } from '@shared/helpers';
import { ImageDirective, TextDirective } from '@shared/directives';
import { HeaderComponent } from '@widgets/header';
import { LangEnum, LangTextI } from '@shared/interfaces';

@Component({
  selector: 'org-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, ImageDirective, TextDirective],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 
    'class': 'page' 
  }
})
export class RegistrationComponent {
  private formBuilder = inject(FormBuilder);
  private userNameService = inject(UserNameService);
  private langService = inject(LangService);

  @ViewChild('emailInput') private emailInput!: ElementRef<HTMLInputElement>;

  public userName$i = this.userNameService.getUserName;

  public registrationForm: FormGroup;
  public isSubmited = false;

  public language!: LangEnum;

  constructor() {
    this.registrationForm =  this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, Validators.minLength(13)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      agreement: [false, Validators.requiredTrue]
    });

    effect(() => {
      this.language = this.langService.getLang$i();
    });
  }

  public ngOnInit(): void {
    this.registrationForm.patchValue({name: this.userName$i()});
  }

  public ngAfterViewInit(): void {
    if (this.userName$i()) {
      this.emailInput.nativeElement.focus();
    }
  }

  public onSubmit(): void {
    if (this.registrationForm.valid) {
      // Here, you can send the registration data to your backend service
      const formData = this.registrationForm.value;
      console.log('Registration data:', formData);
      // Reset the form after successful registration
      // this.registrationForm.reset();
      // this.registrationForm.markAsUntouched();
    } else {
      // Display an error message or take appropriate action for invalid form
      this.isSubmited = true;
      console.log(this.registrationForm.value, this.registrationForm.get('email'), 'registrationForm')
      // alert('Please fill in all the required fields correctly.');
      
    }
  }

  public isValidControl(controlName: string): boolean {
    return isValidFormControl(controlName, this.registrationForm, this.isSubmited);
  }

  public getErrorMessage(controlName: string): string | null {
    return getFormControlErrorMessage(controlName, this.registrationForm, this.language)
  }
}
