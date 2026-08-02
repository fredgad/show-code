import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TextDirective } from '@shared/directives';
import { LangTextI } from '@shared/interfaces';
import { LangService } from '@shared/services';
import { OverflowMarqueeComponent } from '@features';

type AppDrawerItem = {
  id: string;
  icon: string;
  route: string;
  exact?: boolean;
  label: LangTextI;
};

@Component({
  selector: 'org-app-drawer',
  standalone: true,
  imports: [TextDirective, RouterModule, OverflowMarqueeComponent],
  templateUrl: './app-drawer.component.html',
  styleUrl: './app-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppDrawerComponent implements OnChanges, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private langService = inject(LangService);
  private focusFrame?: number;
  private touchSwipeStart?: { identifier: number; x: number; y: number; startedAt: number };

  @Input() public open = false;
  @Output() public closeRequested = new EventEmitter<void>();
  @ViewChild('closeButton') private closeButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('drawer') private drawer?: ElementRef<HTMLElement>;

  public readonly items: AppDrawerItem[] = [
    {
      id: 'capture',
      icon: 'recorder',
      route: '/capture',
      label: { ENG: 'Video recorder', ESP: 'Grabadora de vídeo', RUS: 'Видеорегистратор' }
    },
    {
      id: 'saved-media',
      icon: 'videos',
      route: '/profile/saved-media',
      label: { ENG: 'Saved media', ESP: 'Medios guardados', RUS: 'Сохранённые медиа' }
    },
    {
      id: 'trusted-people',
      icon: 'trusted',
      route: '/profile/trusted-people',
      label: { ENG: 'Trusted people', ESP: 'Personas de confianza', RUS: 'Доверенные люди' }
    },
    {
      id: 'requests',
      icon: 'requests',
      route: '/profile/requests',
      label: { ENG: 'Requests', ESP: 'Solicitudes', RUS: 'Запросы' }
    },
    {
      id: 'notification-settings',
      icon: 'notifications',
      route: '/profile/notification-settings',
      label: { ENG: 'Notification settings', ESP: 'Ajustes de notificaciones', RUS: 'Настройки оповещений' }
    },
    {
      id: 'account-settings',
      icon: 'settings',
      route: '/profile/account-settings',
      label: { ENG: 'Account settings', ESP: 'Ajustes de la cuenta', RUS: 'Настройки аккаунта' }
    },
    {
      id: 'profile',
      icon: 'profile',
      route: '/profile',
      exact: true,
      label: { ENG: 'Profile', ESP: 'Perfil', RUS: 'Профиль' }
    }
  ];

  public ngOnChanges(changes: SimpleChanges): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!changes['open']?.currentValue) {
      this.resetSwipeVisual();
      return;
    }

    this.cancelFocusFrame();
    this.focusFrame = window.requestAnimationFrame(() => this.closeButton?.nativeElement.focus());
  }

  public ngOnDestroy(): void {
    this.cancelFocusFrame();
    this.resetSwipeVisual();
  }

  public requestClose(): void {
    this.closeRequested.emit();
  }

  public resolveLabel(label: LangTextI): string {
    return this.langService.resolveText(label);
  }

  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    const menuButton = target instanceof Element ? target.closest('[aria-controls="app-navigation-drawer"]') : null;

    if (!this.open || !target || menuButton || this.drawer?.nativeElement.contains(target)) {
      return;
    }

    this.requestClose();
  }

  public onTouchStart(event: TouchEvent): void {
    if (!this.open || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches.item(0);
    if (!touch) {
      return;
    }

    this.touchSwipeStart = {
      identifier: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      startedAt: performance.now()
    };
  }

  public onTouchEnd(event: TouchEvent): void {
    const start = this.touchSwipeStart;
    this.touchSwipeStart = undefined;

    if (!start) {
      return;
    }

    const touch = this.findTouch(event.changedTouches, start.identifier);
    if (!touch) {
      return;
    }

    const distanceX = touch.clientX - start.x;
    const distanceY = touch.clientY - start.y;
    const duration = Math.max(1, performance.now() - start.startedAt);
    const drawerWidth = this.drawer?.nativeElement.clientWidth ?? 0;
    const distanceThreshold = Math.min(72, Math.max(42, drawerWidth * 0.16));
    const isHorizontalSwipe = distanceX > 0 && distanceX > Math.abs(distanceY) * 1.05;
    const isFastSwipe = distanceX > 24 && distanceX / duration > 0.25;
    const shouldClose = isHorizontalSwipe && (distanceX >= distanceThreshold || isFastSwipe);

    this.resetSwipeVisual();

    if (shouldClose) {
      if (event.cancelable) {
        event.preventDefault();
      }
      this.requestClose();
    }
  }

  public onTouchMove(event: TouchEvent): void {
    const start = this.touchSwipeStart;
    if (!start) {
      return;
    }

    const touch = this.findTouch(event.touches, start.identifier);
    if (!touch) {
      return;
    }

    const distanceX = touch.clientX - start.x;
    const distanceY = touch.clientY - start.y;
    const isHorizontalSwipe = distanceX > 8 && distanceX > Math.abs(distanceY) * 1.05;
    if (!isHorizontalSwipe) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const drawer = this.drawer?.nativeElement;
    if (!drawer) {
      return;
    }

    const offset = Math.min(drawer.clientWidth, Math.max(0, distanceX));
    drawer.classList.add('--swiping');
    drawer.style.setProperty('--drawer-swipe-offset', `${offset}px`);
  }

  public onTouchCancel(): void {
    this.touchSwipeStart = undefined;
    this.resetSwipeVisual();
  }

  private findTouch(touches: TouchList, identifier: number): Touch | undefined {
    for (let index = 0; index < touches.length; index += 1) {
      const touch = touches.item(index);
      if (touch?.identifier === identifier) {
        return touch;
      }
    }

    return undefined;
  }

  private resetSwipeVisual(): void {
    const drawer = this.drawer?.nativeElement;
    drawer?.classList.remove('--swiping');
    drawer?.style.removeProperty('--drawer-swipe-offset');
  }

  private cancelFocusFrame(): void {
    if (this.focusFrame === undefined || !isPlatformBrowser(this.platformId)) {
      return;
    }

    window.cancelAnimationFrame(this.focusFrame);
    this.focusFrame = undefined;
  }
}
