import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'org-image-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-modal.component.html',
  styleUrl: './image-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageModalComponent {
  @Input() public imageUrl!: string | ArrayBuffer;

  private cdr = inject(ChangeDetectorRef)

  public isVisible = false;

  public show(): void {
    this.isVisible = true;
    this.cdr.markForCheck();
  }

  public hide(): void {
    this.isVisible = false;
  }
}
