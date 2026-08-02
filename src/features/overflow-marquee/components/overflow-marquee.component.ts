import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'org-overflow-marquee',
  standalone: true,
  templateUrl: './overflow-marquee.component.html',
  styleUrl: './overflow-marquee.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverflowMarqueeComponent implements AfterViewInit, OnChanges, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private animation?: Animation;
  private measureFrame?: number;
  private reducedMotionQuery?: MediaQueryList;
  private isVisible = true;

  @Input({ required: true }) public text = '';

  @ViewChild('viewport') private viewport?: ElementRef<HTMLElement>;
  @ViewChild('track') private track?: ElementRef<HTMLElement>;

  public ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionQuery.addEventListener('change', this.handleMotionPreferenceChange);

    this.resizeObserver = new ResizeObserver(() => this.scheduleMeasure());
    this.resizeObserver.observe(this.viewport!.nativeElement);
    this.resizeObserver.observe(this.track!.nativeElement);

    this.intersectionObserver = new IntersectionObserver(entries => {
      const isVisible = entries[0]?.isIntersecting ?? true;
      if (this.isVisible === isVisible) {
        return;
      }

      this.isVisible = isVisible;
      if (isVisible) {
        this.scheduleMeasure();
      } else {
        this.cancelMeasureFrame();
        this.stopAnimation();
      }
    });
    this.intersectionObserver.observe(this.viewport!.nativeElement);
    this.scheduleMeasure();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['text'] && !changes['text'].firstChange) {
      this.scheduleMeasure();
    }
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.reducedMotionQuery?.removeEventListener('change', this.handleMotionPreferenceChange);
    this.cancelMeasureFrame();
    this.stopAnimation();
  }

  private readonly handleMotionPreferenceChange = (): void => {
    this.scheduleMeasure();
  };

  private scheduleMeasure(): void {
    if (!isPlatformBrowser(this.platformId) || !this.viewport || !this.track) {
      return;
    }

    this.cancelMeasureFrame();
    this.measureFrame = window.requestAnimationFrame(() => this.updateAnimation());
  }

  private updateAnimation(): void {
    const viewport = this.viewport?.nativeElement;
    const track = this.track?.nativeElement;

    this.measureFrame = undefined;
    this.stopAnimation();

    if (!viewport || !track || !this.isVisible || this.reducedMotionQuery?.matches) {
      return;
    }

    const distance = Math.ceil(track.scrollWidth - viewport.clientWidth);
    if (distance <= 1) {
      return;
    }

    const startPause = 2000;
    const endPause = 500;
    const travelDuration = Math.min(10000, Math.max(2000, (distance / 30) * 1000));
    const totalDuration = startPause + travelDuration * 2 + endPause;
    const endTransform = `translate3d(${-distance}px, 0, 0)`;

    track.style.willChange = 'transform';
    this.animation = track.animate(
      [
        { transform: 'translate3d(0, 0, 0)', offset: 0 },
        { transform: 'translate3d(0, 0, 0)', offset: startPause / totalDuration, easing: 'ease-in-out' },
        { transform: endTransform, offset: (startPause + travelDuration) / totalDuration },
        {
          transform: endTransform,
          offset: (startPause + travelDuration + endPause) / totalDuration,
          easing: 'ease-in-out'
        },
        { transform: 'translate3d(0, 0, 0)', offset: 1 }
      ],
      {
        duration: totalDuration,
        iterations: Infinity,
        fill: 'both'
      }
    );
  }

  private stopAnimation(): void {
    this.animation?.cancel();
    this.animation = undefined;

    if (this.track) {
      this.track.nativeElement.style.transform = 'translate3d(0, 0, 0)';
      this.track.nativeElement.style.willChange = 'auto';
    }
  }

  private cancelMeasureFrame(): void {
    if (this.measureFrame === undefined || !isPlatformBrowser(this.platformId)) {
      return;
    }

    window.cancelAnimationFrame(this.measureFrame);
    this.measureFrame = undefined;
  }
}
