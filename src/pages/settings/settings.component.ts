import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@widgets/header';
import { ImageDirective, TextDirective } from '@shared/directives';
import { CheckboxComponent } from '@features/checkbox';
import { FooterComponent } from '@widgets/footer';
import { ImageModalComponent } from '@features/image-modal';

@Component({
  selector: 'org-settings',
  standalone: true,
  imports: [CommonModule, HeaderComponent, TextDirective, CheckboxComponent, ImageDirective, FooterComponent, ImageModalComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>; // Добавляем ViewChild

  private cdr = inject(ChangeDetectorRef);

  public imageUrl: string | ArrayBuffer | null | undefined = null;
  public fileName = 'Файл не выбран';

  public onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file) {
      this.fileName = file.name;

      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imageUrl = e.target?.result;
        this.cdr.markForCheck();

        // save avatar to server here ....
      };
      
      reader.readAsDataURL(file);
    } else {
      this.fileName = 'Файл не выбран';
    }
  }

  public triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
}
