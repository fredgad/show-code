import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { VaultMediaService } from './vault-media.service';
import { VaultItem } from './vault.models';

@Component({
  selector: 'org-vault-poster',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    @if (poster | async; as source) {
      <img [src]="source" alt="" loading="lazy" decoding="async" (error)="poster = undefined" />
    } @else {
      <svg viewBox="0 0 24 24" aria-hidden="true"><use href="assets/icons/profile.svg#videos" /></svg>
    }
  `,
  styles: [`
    :host { display: grid; place-items: center; position: absolute; inset: 0; }
    img { width: 100%; height: 100%; object-fit: cover; }
    svg { width: 2rem; fill: none; color: #aac1d7; stroke: currentColor; stroke-width: 1.5; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VaultPosterComponent implements OnChanges {
  private readonly media = inject(VaultMediaService);
  @Input({ required: true }) item!: VaultItem;
  poster?: Observable<string | null>;

  ngOnChanges(): void {
    this.poster = this.media.posterUrl(this.item);
  }
}
