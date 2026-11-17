import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageDirective } from '@shared/directives';
import { Router } from '@angular/router';
import { LangService } from '@shared/services';

@Component({
  selector: 'org-logo',
  standalone: true,
  imports: [CommonModule, ImageDirective],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoComponent {
  private router = inject(Router);
  public langService = inject(LangService);
  
  @Input() public linkToMain: boolean = false;
  @Input() public isTitle: boolean = true;
   
  public goToMain(): void {
    this.router.navigateByUrl('/');
  }
}
