import { ChangeDetectionStrategy, Component, OnInit, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent, FooterComponent  } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { RouterModule } from '@angular/router';
import { LangService, LocalStorageService, WindowEventsService } from '@shared/services';

@Component({
  selector: 'org-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ImageDirective, TextDirective, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private langService = inject(LangService);
  private storage = inject(LocalStorageService);
  private windowEventsService = inject(WindowEventsService);

  public isMobile$ = this.windowEventsService.isMobile$;

  public abbrTitle$i: Signal<string> = this.langService.textByLanguage({
    ENG: 'Profile settings',
    ESP: 'Configuración de perfil',
    RUS: 'Настройки профиля',
  });

  public isMenuOpen: boolean = true;

  public ngOnInit(): void {
    if (this.storage.getItem('HBH/profile')) {
      this.isMenuOpen = false;
    }
    this.storage.setItem('HBH/profile', 'true');
  }

  public onMenuClick(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
