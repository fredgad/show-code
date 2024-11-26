import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '@features/logo';
import { Router, RouterModule, UrlTree } from '@angular/router';
import { LangComponent } from '@features/lang';
import { ImageDirective, TextDirective } from '@shared/directives';
import { AuthService, LangService, WindowEventsService } from '@shared/services';
import { AppStoreFacade } from '@store';

@Component({
  selector: 'org-header',
  standalone: true,
  imports: [CommonModule, LogoComponent, LangComponent, TextDirective, ImageDirective, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private langService = inject(LangService);

  public isMobile$ = inject(WindowEventsService).isMobile$;
  public userData$ = inject(AppStoreFacade).userData$;

  public isLoggedIn = this.authService.isLoggedIn();

  public abbrTitle$i: Signal<string> = this.langService.textByLanguage({
    ENG: 'Profile settings',
    ESP: 'Configuración de perfil',
    RUS: 'Настройки профиля'
  });

  public goToPath(path: string | UrlTree): void {
    this.router.navigateByUrl(path);
  }
}
