import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    let hash = 0;
    const idStr = this.id.toString();
    for (let i = 0; i < idStr.length; i++) {
      const char = idStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Преобразование в 32bit целое число
    }
  
    // Преобразуем хеш в шестнадцатеричную строку и обрезаем/дополняем до 6 символов
    let color = Math.abs(hash).toString(16).substring(0, 6);
    while (color.length < 6) {
      color += '0';
    }
  
    return `#${color}`;
  }
}
