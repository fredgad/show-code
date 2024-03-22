import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageDirective, TextDirective } from '@shared/directives';
import { EmptyAvatarComponent } from '@features/empty-avatar';
import { DeleteButtonComponent } from '@features/delete-button';
import { CheckboxComponent } from '@features/checkbox';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'org-trusted-people',
  standalone: true,
  imports: [CommonModule, ImageDirective, EmptyAvatarComponent, TextDirective, DeleteButtonComponent, CheckboxComponent, RouterModule],
  templateUrl: './trusted-people.component.html',
  styleUrl: './trusted-people.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustedPeopleComponent {
  public trustedPeopleList = [
    {
      id: 6421,
      username: 'Fred Friend',
      email: 'fsaf@mail.org',
      image: 'img_1.webp',
      activeListener: true
    },
    {
      id: 51232,
      username: 'Fred Friend 2',
      email: 'fsaf@mail.org',
      image: '',
      activeListener: false
    },
    {
      id: 2141323,
      username: 'Fred Friend 3',
      email: 'safsad@mail.org',
      image: '',
      activeListener: true
    },
    {
      id: 4231,
      username: 'Fred Friend 4',
      email: 'fsaf@mail.org',
      image: '',
      activeListener: true
    },
    {
      id: 25,
      username: 'Fred Friend 5',
      email: 'fsaf@mail.org',
      image: '',
      activeListener: false
    },
  ];

  public isChecked = false;


  public onCheckboxChange(event: Event): void {  // change trusted notifications here
    const isChecked = (event.target as HTMLInputElement).checked;

  }

  public onDelete(event: boolean, username: string): void { //    delete trusted user here.

  }
}
