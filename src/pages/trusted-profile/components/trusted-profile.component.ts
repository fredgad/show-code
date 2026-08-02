import { ChangeDetectionStrategy, Component, Signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '@widgets/footer';
import { HeaderComponent } from '@widgets/header';
import { TextDirective } from '@shared/directives';
import { ActivatedRoute } from '@angular/router';
import { AudioBlockComponent, VideoBlockComponent } from '@widgets';
import { AvatarComponent, OverflowMarqueeComponent } from '@features';
import { AppStoreFacade } from '@store';
import { combineLatest, map, Observable, tap } from 'rxjs';
import { TrustedPersonIN } from '@shared';
import { LangService } from '@shared/services';

@Component({
  selector: 'org-trusted-profile',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    TextDirective,
    VideoBlockComponent,
    AudioBlockComponent,
    AvatarComponent,
    OverflowMarqueeComponent
  ],
  templateUrl: './trusted-profile.component.html',
  styleUrl: './trusted-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustedProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private facade = inject(AppStoreFacade);
  private langService = inject(LangService);

  public trustedPeople$ = inject(AppStoreFacade).trustedPeople$;
  public trustedPerson$!: Observable<TrustedPersonIN | undefined>;

  public keyId!: string;
  public currentTab = 0;
  public videoLabel$i: Signal<string> = this.langService.textByLanguage({ ENG: 'Video', ESP: 'Video', RUS: 'Видео' });
  public audioLabel$i: Signal<string> = this.langService.textByLanguage({ ENG: 'Audio', ESP: 'Audio', RUS: 'Аудио' });

  public ngOnInit(): void {
    const keyId$ = this.route.paramMap.pipe(
      map(paramMap => paramMap.get('keyId') || ''),
      tap(keyId => {
        this.keyId = keyId;

        if (keyId) {
          this.facade.getTrustedUsersByKeyIds([keyId]);
        }
      })
    );

    this.trustedPerson$ = combineLatest([this.trustedPeople$, keyId$]).pipe(
      map(([trustedPeople, keyId]) => trustedPeople?.find(person => person?.keyId === keyId))
    );
  }

  public changeTab(tab: number): void {
    this.currentTab = tab;
  }
}
