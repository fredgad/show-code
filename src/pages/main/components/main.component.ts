import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  OnDestroy,
  PLATFORM_ID,
  Signal,
  inject
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '@widgets/footer';
import { HeaderComponent } from '@widgets/header';
import { ImageDirective, TextDirective } from '@shared/directives';
import { PRESENTATION_URLS } from '@shared/constants';
import { LangTextI } from '@shared/interfaces';
import { LangService } from '@shared/services';
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
export class MainComponent implements AfterViewInit, OnDestroy {
  private langService = inject(LangService);
  private hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private howStepObserver?: IntersectionObserver;
  private howStepMutationObserver?: MutationObserver;
  private howStepAnimationFrame?: number;
  private observedHowSteps = new WeakSet<Element>();

  @HostBinding('class') hostClass = 'page';

  public text: Record<string, LangTextI> = TEXT_MAIN;
  public presentationUrl$i: Signal<string> = this.langService.textByLanguage(PRESENTATION_URLS);

  public ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const section = this.hostElement.nativeElement.querySelector<HTMLElement>('.how-to-use');

    if (!section || !('IntersectionObserver' in window)) {
      return;
    }

    section.classList.add('is-motion-preparing');
    this.howStepObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-revealed');
          this.howStepObserver?.unobserve(entry.target);
        });
      },
      {
        threshold: 0.04,
        rootMargin: '0px 0px -13% 0px'
      }
    );

    this.howStepAnimationFrame = window.requestAnimationFrame(() => {
      section.classList.add('is-motion-ready');
      section.classList.remove('is-motion-preparing');
      this.observeHowSteps(section);
      this.howStepMutationObserver = new MutationObserver(() => this.observeHowSteps(section));
      this.howStepMutationObserver.observe(section, { childList: true, subtree: true });
    });
  }

  public ngOnDestroy(): void {
    if (this.howStepAnimationFrame !== undefined) {
      window.cancelAnimationFrame(this.howStepAnimationFrame);
    }

    this.howStepObserver?.disconnect();
    this.howStepMutationObserver?.disconnect();
  }

  public toggleText(event: Event): void {
    const target = event.currentTarget as HTMLElement;

    if (target.classList.contains('--open')) {
      target.classList.remove('--open');
    } else {
      target.classList.add('--open');
    }
  }

  private observeHowSteps(section: HTMLElement): void {
    section.querySelectorAll('.how-step').forEach(step => {
      if (this.observedHowSteps.has(step)) {
        return;
      }

      this.observedHowSteps.add(step);
      this.howStepObserver?.observe(step);
    });
  }
}
