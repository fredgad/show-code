import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppStoreFacade } from '@store';

@Component({
  selector: 'org-trusted-request',
  standalone: true,
  imports: [CommonModule, TextDirective, ReactiveFormsModule],
  templateUrl: './trusted-request.component.html',
  styleUrl: './trusted-request.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustedRequestComponent {
  private formBuilder = inject(FormBuilder);
  private appStoreFacade = inject(AppStoreFacade);

  public keyIdForm: FormGroup = this.formBuilder.group({
    keyId: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9)]]
  });

  public onSubmit(): void {
    if (this.keyIdForm.valid) {
      this.appStoreFacade.addUserByKeyId(this.keyIdForm.value.keyId);

      this.keyIdForm.reset();
    } else {
      console.log(this.keyIdForm.value, this.keyIdForm.get('key'), 'Add user by key Form error');
    }
  }
}
