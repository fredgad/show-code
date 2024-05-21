import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { WINDOW } from "../../tokens/window";
import { MOBILE_BREAKPOINT } from "../../constants/constants";


@Injectable({
  providedIn: 'root'
})
export class WindowEventsService {
  constructor(
    @Inject(WINDOW) private window: Window,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  public readonly isMobile$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(MOBILE_BREAKPOINT >= this.currentScreenWidth);

  public set scrollTop(px: number) {
    if (this.window.scrollTo) {
      this.window.scrollTo(this.currentScrollLeft, px);
    } else {
      this.document.documentElement.scrollTop = px;
    }
  }

  public get currentScrollTop(): number {
    return this.window.pageYOffset || this.document.documentElement.scrollTop || 0;
  }

  public get currentScrollLeft(): number {
    return this.window.pageXOffset || this.document.documentElement.scrollLeft || 0;
  }

  public get windowHeight(): number {
    return this.window?.innerHeight || this.document.documentElement.clientHeight || this.document.body.clientHeight;
  }

  public get currentScreenWidth(): number {
    return this.window?.innerWidth > 0 ? this.window.innerWidth : screen.width;
  }
}