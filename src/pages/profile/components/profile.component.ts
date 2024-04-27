import { ChangeDetectionStrategy, Component, OnInit, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent, FooterComponent  } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { RouterModule } from '@angular/router';
import { AuthService, LangService, LocalStorageService, WindowEventsService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { Observable } from 'rxjs';
import { StoreUserI } from '@shared/interfaces';

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
  private appStoreFacade = inject(AppStoreFacade);

  public isMobile$ = this.windowEventsService.isMobile$;

  public userData$: Observable<StoreUserI> = this.appStoreFacade.userData$;

  public abbrTitle$i: Signal<string> = this.langService.textByLanguage({
    ENG: 'Profile settings',
    ESP: 'Configuración de perfil',
    RUS: 'Настройки профиля',
  });

  public isMenuOpen: boolean = true;

  public ngOnInit(): void {
    this.appStoreFacade.getUserData();

    this.cLoseTabsForNewUser();
  }

  private cLoseTabsForNewUser(): void {
    if (this.storage.getItem('HBH/profile')) {
      this.isMenuOpen = false;
    }
    this.storage.setItem('HBH/profile', 'true');
  }

  public onMenuClick(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
