import { Location, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  ViewChild,
  afterNextRender,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SITE_LANGUAGES } from '@features/lang';
import { AuthService, LangService } from '@shared/services';
import { HeaderComponent } from '@widgets/header';
import { asapScheduler, observeOn } from 'rxjs';
import { LANDING_COPY } from './landing.copy';
import { PresentationDialogComponent } from './presentation-dialog.component';
import { RecorderDemoHomeComponent } from './recorder-demo/recorder-demo-home.component';
import { RECORDER_DEMO_COPY } from './recorder-demo/recorder-demo.copy';
import { RecorderDemoScene, bindRecorderDemo } from './recorder-demo/recorder-demo.timeline';

@Component({
  selector: 'org-landing',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    RouterLink,
    HeaderComponent,
    PresentationDialogComponent,
    RecorderDemoHomeComponent
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss', './landing-sections.scss', './landing-hero.scss', './landing-recorder.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingComponent {
  private readonly langService = inject(LangService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly zone = inject(NgZone);
  private readonly recordingSeconds = signal(0);
  private refreshFilm?: () => void;

  @ViewChild('heroFilm') private heroFilm!: ElementRef<HTMLVideoElement>;
  @ViewChild('recorderFrame') private recorderFrame!: ElementRef<HTMLCanvasElement>;
  @ViewChild('recorderShowcase') private recorderShowcase!: ElementRef<HTMLElement>;
  @ViewChild(PresentationDialogComponent) private presentation!: PresentationDialogComponent;
  @ViewChild('presentationTrigger') private presentationTrigger!: ElementRef<HTMLButtonElement>;

  public readonly auth = inject(AuthService);
  public readonly lang = this.langService.getLang$i;
  public readonly copy = computed(() => LANDING_COPY[this.lang()]);
  public readonly expandedFaq = signal<number | null>(null);
  public readonly filmVisible = signal(false);
  public readonly filmPlaying = signal(false);
  public readonly filmAllowed = signal(false);
  public readonly filmPaused = signal(false);
  public readonly recorderIntroDone = signal(false);
  public readonly recorderDemoCopy = computed(() => RECORDER_DEMO_COPY[this.lang()]);
  public readonly recorderDemoScene = signal<RecorderDemoScene>('emergency');
  public readonly recorderPreparing = computed(() => {
    const scene = this.recorderDemoScene();
    return scene === 'verifiable-home' || scene === 'verifiable-loading';
  });
  public readonly recorderTimer = computed(() => {
    const elapsed = this.recordingSeconds();
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  });
  public readonly androidDownloadUrl = '/assets/downloads/e-stream.apk';

  public readonly languageTag = computed(() => SITE_LANGUAGES.find(language => language.id === this.lang())?.tag ?? 'en');
  public readonly articleUrl = computed(() => `https://soyuz.app/read/e-stream?lang=${this.languageTag()}`);
  public readonly stepIcons = ['record', 'cloud', 'shield'];

  constructor() {
    const previousTitle = this.title.getTitle();
    const previousDescription = this.meta.getTag('name="description"')?.content;
    effect(() => {
      this.title.setTitle(this.copy().title);
      this.meta.updateTag({ name: 'description', content: this.copy().description });
    });
    effect(onCleanup => {
      if (!this.recorderIntroDone() || !this.filmPlaying() || !this.filmAllowed() || this.recorderPreparing()) {
        return;
      }
      const clock = this.zone.runOutsideAngular(() =>
        window.setInterval(() => this.zone.run(() => this.recordingSeconds.update(seconds => seconds + 1)), 1000)
      );
      onCleanup(() => window.clearInterval(clock));
    });

    this.destroyRef.onDestroy(() => {
      this.title.setTitle(previousTitle);
      if (previousDescription === undefined) {
        this.meta.removeTag('name="description"');
      } else {
        this.meta.updateTag({ name: 'description', content: previousDescription });
      }
    });

    afterNextRender(() => {
      const film = this.heroFilm.nativeElement;
      this.bindRecorderPreview(film, this.recorderFrame.nativeElement);
      const dispose = this.zone.runOutsideAngular(() =>
        bindRecorderDemo(film, this.recorderShowcase.nativeElement, scene => {
          this.zone.run(() => {
            this.recorderDemoScene.set(scene);
            this.recordingSeconds.set(0);
            this.recorderIntroDone.set(scene !== 'emergency');
          });
        })
      );
      this.destroyRef.onDestroy(dispose);
      this.bindFilmPlayback(film);
      this.route.fragment.pipe(observeOn(asapScheduler), takeUntilDestroyed(this.destroyRef)).subscribe(fragment => {
        if (fragment === 'presentation') {
          const trigger = this.presentationTrigger.nativeElement;
          trigger.scrollIntoView({ block: 'center', behavior: 'instant' });
          this.presentation.open(trigger);
        }
      });
    });
  }

  public sectionHref(fragment: string): string {
    const url = this.router.createUrlTree([], { relativeTo: this.route, queryParamsHandling: 'preserve', fragment });
    return this.location.prepareExternalUrl(this.router.serializeUrl(url));
  }

  public toggleFilm(): void {
    this.filmPaused.update(paused => !paused);
    this.refreshFilm?.();
  }

  public toggleFaq(index: number): void {
    this.expandedFaq.update(expanded => (expanded === index ? null : index));
  }

  private bindRecorderPreview(film: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      return;
    }

    const requestFrame = film.requestVideoFrameCallback?.bind(film) ?? window.requestAnimationFrame.bind(window);
    const cancelFrame = film.cancelVideoFrameCallback?.bind(film) ?? window.cancelAnimationFrame.bind(window);
    const ratio = canvas.width / canvas.height;
    let frameId: number | undefined;

    const draw = () => {
      if (film.readyState >= film.HAVE_CURRENT_DATA) {
        const width = Math.min(film.videoWidth, film.videoHeight * ratio);
        const height = Math.min(film.videoHeight, film.videoWidth / ratio);
        context.drawImage(film, 0, (film.videoHeight - height) / 2, width, height, 0, 0, canvas.width, canvas.height);
        if (canvas.hidden) {
          canvas.hidden = false;
        }
      }

      frameId = film.paused || film.ended ? undefined : requestFrame(draw);
    };
    const start = () => {
      if (frameId === undefined) {
        draw();
      }
    };
    const stop = () => {
      if (frameId !== undefined) {
        cancelFrame(frameId);
        frameId = undefined;
      }
    };
    const showPoster = () => {
      stop();
      canvas.hidden = true;
    };

    this.zone.runOutsideAngular(() => {
      film.addEventListener('playing', start);
      film.addEventListener('pause', stop);
      film.addEventListener('error', showPoster);
    });
    this.destroyRef.onDestroy(() => {
      stop();
      film.removeEventListener('playing', start);
      film.removeEventListener('pause', stop);
      film.removeEventListener('error', showPoster);
    });
  }

  private bindFilmPlayback(film: HTMLVideoElement): void {
    const doc = film.ownerDocument;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & { connection?: EventTarget & { saveData?: boolean } }).connection;
    const supportsObserver = 'IntersectionObserver' in window;
    let inView = !supportsObserver;
    film.muted = true;

    const refresh = () => {
      const allowed = !reducedMotion.matches && !connection?.saveData;
      this.filmAllowed.set(allowed);

      if (!allowed) {
        this.recorderIntroDone.set(true);
      }
      if (!allowed || !inView || doc.hidden || this.filmPaused() || film.error) {
        film.pause();
        return;
      }

      if (!film.hasAttribute('src')) {
        film.src = 'assets/landing/moment.mp4';
      }

      if (film.paused) {
        void film.play().catch((error: DOMException) => {
          if (error.name !== 'AbortError') {
            this.recorderIntroDone.set(true);
          }
        });
      }
    };

    const observer = supportsObserver
      ? new IntersectionObserver(
          ([entry]) => {
            inView = entry.isIntersecting && entry.intersectionRatio >= 0.2;
            refresh();
          },
          { threshold: 0.2 }
        )
      : undefined;

    observer?.observe(film);
    doc.addEventListener('visibilitychange', refresh);
    reducedMotion.addEventListener('change', refresh);
    connection?.addEventListener('change', refresh);
    this.refreshFilm = refresh;
    refresh();

    this.destroyRef.onDestroy(() => {
      observer?.disconnect();
      doc.removeEventListener('visibilitychange', refresh);
      reducedMotion.removeEventListener('change', refresh);
      connection?.removeEventListener('change', refresh);
      film.pause();
    });
  }
}
