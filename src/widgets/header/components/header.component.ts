import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '@features/logo';
import { Router, UrlTree } from '@angular/router';
import { LangComponent } from '@features/lang';
import { ImageDirective, TextDirective } from '@shared/directives';
import { AuthService, WindowEventsService } from '@shared/services';
import { AppStoreFacade } from '@store';


@Component({
  selector: 'org-header',
  standalone: true,
  imports: [CommonModule, LogoComponent, LangComponent, TextDirective, ImageDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  public isMobile$ = inject(WindowEventsService).isMobile$;

  public isLoggedIn = this.authService.isLoggedIn();
  
  public goToPath(path: string | UrlTree): void {
    this.router.navigateByUrl(path)
  }
}
