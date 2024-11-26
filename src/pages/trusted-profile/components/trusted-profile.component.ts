import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '@widgets/footer';
import { HeaderComponent } from '@widgets/header';
import { ImageDirective, TextDirective } from '@shared/directives';
import { ActivatedRoute } from '@angular/router';
import { AudioBlockComponent, VideoBlockComponent } from '@widgets';
import { AppStoreFacade } from '@store';
import { combineLatest, map, Observable } from 'rxjs';
import { TrustedPersonIN } from '@shared';

@Component({
  selector: 'org-trusted-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ImageDirective, TextDirective, VideoBlockComponent, AudioBlockComponent],
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
    this.facade.getUserData();

    this.trustedPerson$ = combineLatest([this.trustedPeople$, this.route.paramMap]).pipe(
      map(([trustedPeople, paramMap]) => {
        const keyId = paramMap.get('keyId');
        this.keyId = keyId || '';

        return trustedPeople?.find(person => person?.keyId === keyId);
      })
    );
  }

  public changeTab(tab: number): void {
    this.currentTab = tab;
  }
}
