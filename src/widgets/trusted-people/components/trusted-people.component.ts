import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageDirective, TextDirective } from '@shared/directives';
import { EmptyAvatarComponent } from '@features/empty-avatar';
import { DeleteButtonComponent } from '@features/delete-button';
import { CheckboxComponent } from '@features/checkbox';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppStoreFacade } from '@store';
import { Observable, Subscription } from 'rxjs';
import { ImageModalComponent } from '@features/image-modal';
import { TrustedPersonI, TrustedPersonIN } from '@shared/interfaces';

interface TrustedUserI {
  _id: string;
  username: string;
  email: string;
  image: string;
  displayed: boolean;
  keyId: string;
}

@Component({
  selector: 'org-trusted-people',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ImageDirective,
    EmptyAvatarComponent,
    TextDirective,
    DeleteButtonComponent,
    CheckboxComponent,
    RouterModule,
    ImageModalComponent
  ],
  templateUrl: './trusted-people.component.html',
  styleUrl: './trusted-people.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustedPeopleComponent implements OnDestroy {
  private formBuilder = inject(FormBuilder);
  private appStoreFacade = inject(AppStoreFacade);
  private router = inject(Router);

  private subscription?: Subscription;

  public trustedPeople$: Observable<TrustedPersonI[]> = this.appStoreFacade.trustedPeople$;
  public isChecked = false;

  public keyIdForm: FormGroup = this.formBuilder.group({
    keyId: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(9)]]
  });

  ngOnInit(): void {
    // this.trustedPeople$
    //   .pipe(
    //     map(trustedPeople => trustedPeople.map(person => person.keyId)),
    //     distinctUntilChanged((prev, curr) => {
    //       console.log(prev, curr, 'prev, curr');
    //       return JSON.stringify(prev) === JSON.stringify(curr);
    //     }),
    //     filter(keyIds => keyIds.length > 0)
    //   )
    //   .subscribe(keyIds => {
    //     console.log('keyIds', keyIds);
    //     this.appStoreFacade.getTrustedUsersByKeyIds(keyIds);
    //   });
  }

  public onSubmit(): void {
    if (this.keyIdForm.valid) {
      const data = {
        keyId: this.keyIdForm.value.keyId
      };

      this.appStoreFacade.addUserByKeyId(this.keyIdForm.value.keyId);

      this.keyIdForm.reset();
    } else {
      console.log(this.keyIdForm.value, this.keyIdForm.get('key'), 'Add user by key Form error');
    }
  }

  public onCheckboxChange(event: Event): void {
    // change trusted notifications here
    const isChecked = (event.target as HTMLInputElement).checked;
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
