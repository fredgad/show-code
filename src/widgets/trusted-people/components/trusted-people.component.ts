import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextDirective } from '@shared/directives';
import { AvatarComponent, DeleteButtonComponent, CheckboxComponent } from '@features';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AppStoreFacade } from '@store';
import { Observable, Subscription } from 'rxjs';
import { TrustedPersonI } from '@shared/interfaces';
import { TrustedRequestComponent } from '@features/trusted-request';

// interface TrustedUserI {
//   _id: string;
//   username: string;
//   email: string;
//   image: string;
//   displayed: boolean;
//   keyId: string;
// }

@Component({
  selector: 'org-trusted-people',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AvatarComponent,
    TextDirective,
    DeleteButtonComponent,
    CheckboxComponent,
    RouterModule,
    TrustedRequestComponent
  ],
  templateUrl: './trusted-people.component.html',
  styleUrl: './trusted-people.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustedPeopleComponent implements OnInit, OnDestroy {
  // private formBuilder = inject(FormBuilder);
  private appStoreFacade = inject(AppStoreFacade);
  private router = inject(Router);

  private subscription?: Subscription;

  public trustedPeople$: Observable<TrustedPersonI[]> = this.appStoreFacade.trustedPeople$;
  public isChecked = false;

  public ngOnInit(): void {
    this.appStoreFacade.getUserData();
  }

  // public keyIdForm: FormGroup = this.formBuilder.group({
  //   keyId: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9)]]
  // });

  // public onSubmit(): void {
  //   if (this.keyIdForm.valid) {
  //     this.appStoreFacade.addUserByKeyId(this.keyIdForm.value.keyId);

  //     this.keyIdForm.reset();
  //   } else {
  //     console.log(this.keyIdForm.value, this.keyIdForm.get('key'), 'Add user by key Form error');
  //   }
  // }

  public onCheckboxChange(event: Event): void {
    // change trusted notifications here
    const isChecked = (event.target as HTMLInputElement).checked;
    console.log(isChecked, 'isChecked');
  }

  public goToTrustedPersonMedia(keyId: string): void {
    this.router.navigate(['/trusted-profile', keyId]);
  }

  public onDelete(event: boolean, keyId: string): void {
    if (event) {
      this.appStoreFacade.removeTrustedUser(keyId);
    }
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
