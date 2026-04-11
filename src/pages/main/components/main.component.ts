import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '@widgets/footer';
import { HeaderComponent } from '@widgets/header';
import { ImageDirective, TextDirective } from '@shared/directives';
import { LangTextI } from '@shared/interfaces';
import { TEXT_MAIN } from '../common/main.text';
// import { MainFormComponent } from './main-form/main-form.component';

@Component({
  selector: 'org-main',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ImageDirective, TextDirective, FormsModule, RouterModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent {
  @HostBinding('class') hostClass = 'page';

  public text: Record<string, LangTextI> = TEXT_MAIN;

  public toggleText(event: Event): void {
    const target = event.currentTarget as HTMLElement;

    if (target.classList.contains('--open')) {
      target.classList.remove('--open');
    } else {
      target.classList.add('--open');
    }
  }
}
