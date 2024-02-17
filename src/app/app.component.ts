import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LangService } from '@shared/services';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'org-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private langService = inject(LangService);

  public ngOnInit(): void {
    this.langService.setStorageLanguage();
  }
}
