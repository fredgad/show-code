import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TextDirective } from '@shared/directives';


@Component({
  selector: 'org-saved-media',
  standalone: true,
  imports: [CommonModule, TextDirective, RouterModule],
  templateUrl: './saved-media.component.html',
  styleUrl: './saved-media.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedMediaComponent {
  
}
