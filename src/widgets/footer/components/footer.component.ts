import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangService } from '@shared/services';

@Component({
  selector: 'org-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  public langService = inject(LangService);
}
