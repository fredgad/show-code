import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '@features/logo';
import { Router, UrlTree } from '@angular/router';
import { LangComponent } from '@features/lang';
import { TextDirective } from '@shared/directives';
import { WindowEventsService } from '@shared/services';


@Component({
  selector: 'org-header',
  standalone: true,
  imports: [CommonModule, LogoComponent, LangComponent, TextDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private router = inject(Router);

  public isMobile$ = inject(WindowEventsService).isMobile$;

  public goToPath(path: string | UrlTree): void {
    this.router.navigateByUrl(path)
  }

  
}
