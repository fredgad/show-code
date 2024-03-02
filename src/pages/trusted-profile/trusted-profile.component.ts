import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from '@widgets/footer';
import { HeaderComponent } from '@widgets/header';
import { ImageDirective, TextDirective } from '@shared/directives';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'org-trusted-profile',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, ImageDirective, RouterModule, TextDirective],
  templateUrl: './trusted-profile.component.html',
  styleUrl: './trusted-profile.component.scss',
})
export class TrustedProfileComponent {}
