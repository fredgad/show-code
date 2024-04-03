import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getHexColorByNumber } from '@shared/helpers';

@Component({
  selector: 'org-empty-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-avatar.component.html',
  styleUrl: './empty-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyAvatarComponent {
  @Input() id: number = 0;

  public get getHexColorById(): string {
    return getHexColorByNumber(this.id);
  }
}
