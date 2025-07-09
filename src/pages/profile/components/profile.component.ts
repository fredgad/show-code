import { ChangeDetectionStrategy, Component, OnInit, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent, FooterComponent } from '@widgets';
import { ImageDirective, TextDirective } from '@shared/directives';
import { RouterModule } from '@angular/router';
import { AuthService, LangService, LocalStorageService, PushService, WindowEventsService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { Observable } from 'rxjs';
import { StoreUserIN } from '@shared/interfaces';
import { ImageModalComponent } from '@features/image-modal';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'org-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ImageDirective, TextDirective, RouterModule, ImageModalComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  // private langService = inject(LangService);
  private storage = inject(LocalStorageService);
  private windowEventsService = inject(WindowEventsService);
  private appStoreFacade = inject(AppStoreFacade);
  private pushService = inject(PushService);

  constructor(private http: HttpClient, private authService: AuthService) {}

  public isMobile$ = this.windowEventsService.isMobile$;

  public userData$: Observable<StoreUserIN> = this.appStoreFacade.userData$;

  // public abbrTitle$i: Signal<string> = this.langService.textByLanguage({
  //   ENG: 'Profile settings',
  //   ESP: 'Configuración de perfil',
  //   RUS: 'Настройки профиля'
  // });

  public isMenuOpen: boolean = true;

  public ngOnInit(): void {
    this.appStoreFacade.getUserData();

    this.pushService.subscribeToNotifications().subscribe(x => {
      console.log(x, 'pushService.subscribeToNotifications');
    });

    // const testSubscription = {
    //   endpoint: "https://fcm.googleapis.com/fcm/send/abcd...",
    //   expirationTime: null,
    //   keys: {
    //     p256dh: "BNcX...",
    //     auth: "RandomAuthKey=="
    //   }
    // };
    // this.authService.saveSubscription(testSubscription).subscribe(x => {
    //   console.log(x, 'pushService.subscribeToNotifications');
    // });

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
