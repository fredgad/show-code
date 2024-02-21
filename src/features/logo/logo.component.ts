import { ChangeDetectionStrategy, Component, Input, Signal, inject } from '@angular/core';
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
  private langService = inject(LangService);
  
  @Input() public linkToMain: boolean = false;
  
  private router = inject(Router);

  public logoTitlePath$i: Signal<string> = this.langService.textByLanguage({
    ENG: 'msr-logo-title.svg',
    ESP: 'msr-logo-title.svg',
    RUS: 'msr-logo-title-ru.svg'
  });
   
  public goToMain(): void {
    this.router.navigateByUrl('/');
  }
}
