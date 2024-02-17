import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageDirective } from '@shared/directives';
import { Router } from '@angular/router';

@Component({
  selector: 'org-logo',
  standalone: true,
  imports: [CommonModule, ImageDirective],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponent {
  @Input() public linkToMain: boolean = false;
  
  private router = inject(Router);
   
  public goToMain(): void {
    this.router.navigateByUrl('/');
  }
}
