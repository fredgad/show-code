import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '@widgets/header';
import { FooterComponent } from '@widgets/footer';
import { LangService, UserNameService } from '@shared/services';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangTextI } from '@shared/interfaces';
import { INPUT_PLACEHOLDER, LOGO_TEXT, LOGO_TITLE, TEXT_MAIN } from '../common/main.text';
import { AuthService } from '@shared/services';

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
  private authService = inject(AuthService);

  public inputPlaceholder$i: Signal<string> = this.langService.textByLanguage(INPUT_PLACEHOLDER);
  public logoTitle$i: Signal<string> = this.langService.textByLanguage(LOGO_TITLE);
  public logoText$i: Signal<string> = this.langService.textByLanguage(LOGO_TEXT);

  public text: Record<string, LangTextI> = TEXT_MAIN;
  public userName: string = '';

  public submitUserName(e: Event): void {
    e.preventDefault();
    this.userNameService.setUserName = this.userName;
    this.router.navigate(['/registration']);
  }

  public getUsers(): void {
    this.authService.getUsers().subscribe(x => {
      console.log(x, 'getUsers x');
    })
  }
}
