import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, HostListener, Input, Output, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '@features/logo';
import { Router, RouterModule, UrlTree } from '@angular/router';
import { LangComponent } from '@features/lang';
import { ImageDirective, TextDirective } from '@shared/directives';
import { AuthService, FontScaleService, LangService, WindowEventsService } from '@shared/services';
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
  private fontScaleService = inject(FontScaleService);
  private langService = inject(LangService);
  private windowEventsService = inject(WindowEventsService);

  @Input() public showDisplayControls = true;
  @Output() public fontDecrease = new EventEmitter<void>();
  @Output() public fontIncrease = new EventEmitter<void>();

  @HostBinding('class.header-hidden') public isHeaderHidden = false;

  public isMobile$ = this.windowEventsService.isMobile$;
  public userData$ = inject(AppStoreFacade).userData$;
  private lastScrollTop = 0;
  private readonly topRevealOffset = 8;
  private readonly scrollDeltaThreshold = 4;

  public abbrTitle$i: Signal<string> = this.langService.textByLanguage({
    ENG: 'Profile settings',
    ESP: 'Configuración de perfil',
    RUS: 'Настройки профиля'
  });

  public get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  public get currentFontScale(): string {
    return `${Math.round(this.fontScaleService.scale * 16)}px`;
  }

  public goToPath(path: string | UrlTree): void {
    this.router.navigateByUrl(path);
  }

  public decreaseFont(): void {
    this.fontScaleService.decrease();
    this.fontDecrease.emit();
  }

  public increaseFont(): void {
    this.fontScaleService.increase();
    this.fontIncrease.emit();
  }

  @HostListener('window:scroll')
  public onWindowScroll(): void {
    const currentScrollTop = this.windowEventsService.currentScrollTop;
    const scrollDelta = currentScrollTop - this.lastScrollTop;

    if (currentScrollTop <= this.topRevealOffset) {
      this.isHeaderHidden = false;
      this.lastScrollTop = 0;
      return;
    }

    if (Math.abs(scrollDelta) < this.scrollDeltaThreshold) {
      return;
    }

    this.isHeaderHidden = scrollDelta > 0;
    this.lastScrollTop = currentScrollTop;
  }
}
