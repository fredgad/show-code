import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from '@widgets/header';
import { FooterComponent } from '@widgets/footer';
import { UserNameService } from '@shared/services';
import { ImageDirective, TextDirective } from '@shared/directives';
import { text_1 } from '../common/main.text';

@Component({
  selector: 'org-main',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ImageDirective, TextDirective, FormsModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 
    'class': 'page' 
  }
})
export class MainComponent {
  private router = inject(Router);
  private userNameService = inject(UserNameService);

  public userName: string = '';

  public text = text_1;

  public submitUserName(e: Event): void {
    e.preventDefault();
    this.userNameService.setUserName = this.userName;
    this.router.navigate(['/registration']);
  }
}
