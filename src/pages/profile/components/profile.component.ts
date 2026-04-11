import { ChangeDetectionStrategy, Component, OnInit, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent, FooterComponent } from '@widgets';
import { TextDirective } from '@shared/directives';
import { RouterModule } from '@angular/router';
import { AuthService, LangService, WindowEventsService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { Observable } from 'rxjs';
import { StoreUserIN } from '@shared/interfaces';
import { AvatarComponent } from '@features';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'org-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, TextDirective, RouterModule, AvatarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  // private langService = inject(LangService);
  private windowEventsService = inject(WindowEventsService);
  private appStoreFacade = inject(AppStoreFacade);

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

  }

  public onMenuClick(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
