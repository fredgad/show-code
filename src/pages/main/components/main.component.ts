import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '@widgets/header';
import { FooterComponent } from '@widgets/footer';
import { LangService, UserNameService } from '@shared/services';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangTextI } from '@shared/interfaces';
import { TEXT_MAIN } from '../common/main.text';

@Component({
  selector: 'org-main',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ImageDirective, TextDirective, FormsModule, RouterModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 
    'class': 'page' 
  }
})
export class MainComponent {
  private router = inject(Router);
  private userNameService = inject(UserNameService);
  private langService = inject(LangService);

  public userName: string = '';

  public inputPlaceholder: Signal<string> = this.langService.textByLanguage({
    ENG: 'Enter your username',
    ESP: 'Esp',
    RUS: 'Введите логин'
  });

  public logoTitle$i: Signal<string> = this.langService.textByLanguage({
    ENG: 'msr-logo-title.svg',
    ESP: 'msr-logo-title.svg',
    RUS: 'msr-logo-title-ru.svg'
  });

  public text: Record<string, LangTextI> = TEXT_MAIN;

  public submitUserName(e: Event): void {
    e.preventDefault();
    this.userNameService.setUserName = this.userName;
    this.router.navigate(['/registration']);
  }
}
