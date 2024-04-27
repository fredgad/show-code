import { ChangeDetectionStrategy, Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '@widgets/header';
import { FooterComponent } from '@widgets/footer';
import { LangService } from '@shared/services';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangTextI } from '@shared/interfaces';
import { AuthService } from '@shared/services';
import { LOGO_TEXT, LOGO_TITLE, TEXT_MAIN } from '../common/main.text';
import { MainFormComponent } from './main-form/main-form.component';

@Component({
  selector: 'org-main',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    MainFormComponent,
    ImageDirective,
    TextDirective,
    FormsModule,
    RouterModule
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 
    'class': 'page' 
  }
})
export class MainComponent {
  private langService = inject(LangService);
  private authService = inject(AuthService);

  public logoTitle$i: Signal<string> = this.langService.textByLanguage(LOGO_TITLE);
  public logoText$i: Signal<string> = this.langService.textByLanguage(LOGO_TEXT);

  public text: Record<string, LangTextI> = TEXT_MAIN;
}
