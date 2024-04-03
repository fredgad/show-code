import { Component, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TextDirective } from '@shared/directives';
import { FormsModule } from '@angular/forms';
import { LangService, UserNameService } from '@shared/services';
import { INPUT_PLACEHOLDER } from '../../common/main.text';

@Component({
  selector: 'org-main-form',
  standalone: true,
  imports: [CommonModule, TextDirective, FormsModule],
  templateUrl: './main-form.component.html',
  styleUrl: './main-form.component.scss',
})
export class MainFormComponent {
  private router = inject(Router);
  private userNameService = inject(UserNameService);
  private langService = inject(LangService);

  public inputPlaceholder$i: Signal<string> = this.langService.textByLanguage(INPUT_PLACEHOLDER);

  public userName: string = '';

  public submitUserName(e: Event): void {
    e.preventDefault();
    this.userNameService.setUserName = this.userName;
    this.router.navigate(['/registration']);
  }
}
