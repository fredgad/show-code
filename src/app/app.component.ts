import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LangService } from '@shared/services';
import { ConfirmPopupComponent } from '@features/confirm-popup';

@Component({
  standalone: true,
  imports: [RouterModule, HttpClientModule, ConfirmPopupComponent],
  providers: [HttpClient, HttpClientModule],
  selector: 'org-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private langService = inject(LangService);

  public ngOnInit(): void {
    this.langService.setStorageLanguage();
  }
}
