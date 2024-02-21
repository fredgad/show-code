import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'org-saved-media',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saved-media.component.html',
  styleUrl: './saved-media.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedMediaComponent {}
