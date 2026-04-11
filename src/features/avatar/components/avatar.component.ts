import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageDirective } from '@shared/directives';
import { EmptyAvatarComponent } from '@features/empty-avatar';
import { ImageModalComponent } from '@features/image-modal';

@Component({
  selector: 'org-avatar',
  standalone: true,
  imports: [CommonModule, ImageDirective, EmptyAvatarComponent, ImageModalComponent],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent {
  @ViewChild(ImageModalComponent) private imageModal?: ImageModalComponent;

  @Input() public imageUrl?: string | ArrayBuffer | null;
  @Input() public size = 80;
  @Input() public previewEnabled = true;
  @Input() public emptyAvatarId: number | null = null;
  @Input() public alt = 'Avatar';

  public get imageSrc(): string | null {
    return typeof this.imageUrl === 'string' && this.imageUrl ? this.imageUrl : null;
  }

  public get canPreview(): boolean {
    return !!this.imageSrc && this.previewEnabled;
  }

  public showPreview(): void {
    if (this.canPreview) {
      this.imageModal?.show();
    }
  }
}
