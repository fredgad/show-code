import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '@features';
import { AppStoreFacade } from '@store';
import { TextDirective } from '@shared/directives';

@Component({
  selector: 'org-profile-overview',
  standalone: true,
  imports: [CommonModule, AvatarComponent, TextDirective],
  templateUrl: './profile-overview.component.html',
  styleUrl: './profile-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileOverviewComponent implements OnInit {
  private appStoreFacade = inject(AppStoreFacade);

  public userData$ = this.appStoreFacade.userData$;

  public ngOnInit(): void {
    this.appStoreFacade.getUserData();
  }
}
