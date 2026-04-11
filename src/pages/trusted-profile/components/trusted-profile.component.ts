import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '@widgets/footer';
import { HeaderComponent } from '@widgets/header';
import { TextDirective } from '@shared/directives';
import { ActivatedRoute } from '@angular/router';
import { AudioBlockComponent, VideoBlockComponent } from '@widgets';
import { AvatarComponent } from '@features';
import { AppStoreFacade } from '@store';
import { combineLatest, map, Observable, tap } from 'rxjs';
import { TrustedPersonIN } from '@shared';

@Component({
  selector: 'org-trusted-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, TextDirective, VideoBlockComponent, AudioBlockComponent, AvatarComponent],
  templateUrl: './trusted-profile.component.html',
  styleUrl: './trusted-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustedProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private facade = inject(AppStoreFacade);

  public trustedPeople$ = inject(AppStoreFacade).trustedPeople$;
  public trustedPerson$!: Observable<TrustedPersonIN | undefined>;

  public keyId!: string;
  public currentTab = 0;

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
