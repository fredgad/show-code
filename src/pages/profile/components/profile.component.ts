import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent, FooterComponent  } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'org-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ImageDirective, TextDirective, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {}
