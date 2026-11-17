import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LangService } from '@shared/services';
import { adminText } from './admin.text';

@Component({
  selector: 'org-admin-analytics',
  standalone: true,
  template: `
    <section aria-labelledby="analytics-title">
      <h1 id="analytics-title">{{ text(site ? 'websiteReport' : 'appReport') }}</h1>
      <div class="state">
        <h2>{{ text('analyticsPending') }}</h2>
        <p>{{ text(site ? 'websiteScope' : 'appScope') }}</p>
      </div>
    </section>
  `,
  styles: [`
    h1 { font-size: clamp(1.75rem, 4vw, 2.45rem); letter-spacing: -.035em; line-height: 1.2; margin: 0 0 18px; }
    .state { background: #fff; border: 1px solid #dbe4f1; border-radius: 12px; padding: clamp(16px, 3vw, 25px); }
    h2 { font-size: 1.13rem; margin: 0 0 6px; }
    p { color: #526783; margin: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAnalyticsComponent {
  private readonly language = inject(LangService);
  readonly site = inject(ActivatedRoute).snapshot.data['source'] === 'site';

  text(key: keyof typeof adminText): string {
    return this.language.resolveText(adminText[key]);
  }
}
