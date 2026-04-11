import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class FontScaleService {
  private readonly document = inject(DOCUMENT);
  private readonly storageService = inject(LocalStorageService);

  private readonly storageKey = 'fontScale';
  private readonly minFontScale = 0.9;
  private readonly maxFontScale = 1.6;
  private readonly fontStep = 0.15;
  private readonly defaultFontScale = 1;

  private currentScale = this.defaultFontScale;

  public init(): void {
    const storedValue = Number(this.storageService.getItem(this.storageKey));
    const scale = Number.isFinite(storedValue) && storedValue > 0 ? storedValue : this.defaultFontScale;

    this.applyScale(scale);
  }

  public increase(): number {
    return this.applyScale(this.currentScale + this.fontStep);
  }

  public decrease(): number {
    return this.applyScale(this.currentScale - this.fontStep);
  }

  public get scale(): number {
    return this.currentScale;
  }

  private applyScale(value: number): number {
    const clamped = Math.min(this.maxFontScale, Math.max(this.minFontScale, value));
    this.currentScale = Math.round(clamped * 100) / 100;

    this.document.documentElement.style.setProperty('--font-scale', `${this.currentScale}`);
    this.storageService.setItem(this.storageKey, `${this.currentScale}`);

    return this.currentScale;
  }
}
