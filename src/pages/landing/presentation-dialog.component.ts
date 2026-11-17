import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, Input, ViewChild, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LandingPresentationCopy } from './landing.copy';

@Component({
  selector: 'org-presentation-dialog',
  standalone: true,
  templateUrl: './presentation-dialog.component.html',
  styleUrl: './presentation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresentationDialogComponent {
  private readonly document = inject(DOCUMENT);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private loadedLanguage?: string;
  private trigger?: HTMLElement;
  private loadTimer?: ReturnType<typeof setTimeout>;

  @Input({ required: true }) public copy!: LandingPresentationCopy;
  @Input({ required: true }) public language!: string;
  @ViewChild('dialog', { static: true }) private dialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('frame') private frame?: ElementRef<HTMLIFrameElement>;

  public readonly frameSources = signal<readonly SafeResourceUrl[]>([]);
  public readonly status = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.loadTimer));
  }

  public open(trigger: HTMLElement): void {
    const dialog = this.dialog.nativeElement;
    if (dialog.open) {
      return;
    }

    this.trigger = trigger;
    if (this.loadedLanguage !== this.language || this.status() === 'error') {
      this.load();
    }

    const origin = trigger.getBoundingClientRect();
    dialog.classList.remove('is-opening');
    dialog.showModal();
    this.setOpeningOrigin(dialog, origin);
    dialog.classList.add('is-opening');
  }

  private setOpeningOrigin(dialog: HTMLDialogElement, origin: DOMRect): void {
    const viewport = this.document.documentElement;
    const left = Math.max(0, origin.left);
    const top = Math.max(0, origin.top);
    const width = Math.min(viewport.clientWidth, origin.right) - left;
    const height = Math.min(viewport.clientHeight, origin.bottom) - top;
    const bounds = dialog.getBoundingClientRect();

    if (width <= 0 || height <= 0 || !bounds.width || !bounds.height) {
      dialog.style.removeProperty('--presentation-opening-transform');
      return;
    }

    const x = left + width / 2 - (bounds.left + bounds.width / 2);
    const y = top + height / 2 - (bounds.top + bounds.height / 2);
    dialog.style.setProperty('--presentation-opening-transform',
      `translate(${x}px, ${y}px) scale(${width / bounds.width}, ${height / bounds.height})`
    );
  }

  public load(): void {
    clearTimeout(this.loadTimer);
    this.loadedLanguage = this.language;
    this.status.set('loading');
    const url = `assets/landing/presentation/index.html?embed=1&lang=${encodeURIComponent(this.language)}`;
    this.frameSources.set([this.sanitizer.bypassSecurityTrustResourceUrl(url)]);
    this.loadTimer = setTimeout(() => this.status.set('error'), 15000);
  }

  public restoreFocus(): void {
    this.trigger?.focus({ preventScroll: true });
  }

  public closeFromBackdrop(event: MouseEvent): void {
    const dialog = this.dialog.nativeElement;
    if (event.target !== dialog) {
      return;
    }

    const { left, right, top, bottom } = dialog.getBoundingClientRect();
    if (event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom) {
      dialog.close();
    }
  }

  @HostListener('window:message', ['$event'])
  public onPresentationMessage(event: MessageEvent): void {
    if (
      event.origin !== this.document.location?.origin ||
      event.source !== this.frame?.nativeElement.contentWindow ||
      event.data?.type !== 'e-stream-presentation' ||
      event.data.language !== this.loadedLanguage
    ) {
      return;
    }

    if (event.data.action === 'close') {
      this.dialog.nativeElement.close();
    } else if (event.data.action === 'ready' || event.data.action === 'error') {
      clearTimeout(this.loadTimer);
      this.status.set(event.data.action);
    }
  }
}
