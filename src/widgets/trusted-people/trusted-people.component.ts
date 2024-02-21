import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'org-trusted-people',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trusted-people.component.html',
  styleUrl: './trusted-people.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustedPeopleComponent {}
