import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, NgZone, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LangService } from '@shared/services';
import { finalize } from 'rxjs';
import { PROFILE_NAVIGATION } from '../../../pages/profile/profile-navigation';
import { TRUSTED_PEOPLE_TEXT } from '../components/trusted-people.text';
import { slotIdentity, SlotAllocation, SlotSelection, SlotTarget, TrustAccessApiService } from './trust-access-api.service';
import { TRUST_ACCESS_TEXT, trustDate, trustTimeLeft } from './trust-access.text';

const copy = { ...TRUSTED_PEOPLE_TEXT, ...TRUST_ACCESS_TEXT };

@Component({
  selector: 'org-trusted-slot-allocation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './trusted-slot-allocation.component.html',
  styleUrls: ['./trust-controls.scss', './trusted-slot-allocation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrustedSlotAllocationComponent implements OnInit {
  private readonly api = inject(TrustAccessApiService);
  private readonly language = inject(LangService);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly tick = signal(performance.now());
  private readonly timeBase = signal({ serverTime: Date.now(), tick: performance.now() });
  private readonly markedStale = signal(false);
  readonly people = PROFILE_NAVIGATION.trustedPeople;
  readonly slotIdentity = slotIdentity;
  readonly snapshot = signal<SlotAllocation | null>(null);
  readonly reviewed = signal<{ allocation: SlotAllocation; selection: SlotSelection } | null>(null);
  readonly selected = signal(new Set<string>());
  readonly busy = signal(false);
  readonly error = signal('');
  readonly currentTime = computed(() => this.timeBase().serverTime + Math.max(0, this.tick() - this.timeBase().tick));
  readonly nextDeadline = computed(() => {
    const deadlines = (this.snapshot()?.targets ?? []).filter(target => target.allocationState === 'grace')
      .map(target => target.graceEndsAt).filter((deadline): deadline is string => !!deadline);
    return deadlines.sort((left, right) => Date.parse(left) - Date.parse(right))[0];
  });
  readonly stale = computed(() => this.markedStale() || !!this.snapshot()?.targets.some(target => {
    if (target.allocationState !== 'grace') return false;
    const deadline = Date.parse(target.graceEndsAt ?? '');
    return !Number.isFinite(deadline) || deadline <= this.currentTime();
  }));
  readonly canReview = computed(() => {
    const snapshot = this.snapshot();
    return !!snapshot && snapshot.graceCount > 0 && !this.busy() && !this.stale()
      && this.selected().size === snapshot.requiredCount
      && snapshot.targets.some(target => target.selected !== this.selected().has(slotIdentity(target)));
  });

  ngOnInit(): void {
    if (this.browser) {
      const timer = this.zone.runOutsideAngular(() =>
        window.setInterval(() => this.zone.run(() => this.tick.set(performance.now())), 1000)
      );
      this.destroyRef.onDestroy(() => window.clearInterval(timer));
    }
    this.refresh();
  }

  @HostListener('document:visibilitychange')
  markAfterReturn(): void {
    if (this.document.visibilityState === 'visible' && this.snapshot()) this.markedStale.set(true);
  }

  refresh(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.api.allocation().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false))
    ).subscribe({
      next: snapshot => {
        const serverTime = Date.parse(snapshot.serverNow);
        const tick = performance.now();
        this.tick.set(tick);
        this.timeBase.set({ serverTime, tick });
        this.snapshot.set(snapshot);
        this.selected.set(new Set(snapshot.targets.filter(target => target.selected).map(slotIdentity)));
        this.reviewed.set(null);
        this.markedStale.set(!Number.isFinite(serverTime));
      },
      error: () => {
        this.markedStale.set(!!this.snapshot());
        this.error.set(this.text('loadError'));
      }
    });
  }

  toggle(target: SlotTarget, checked: boolean): void {
    if (!target.eligible || this.busy() || this.stale() || this.reviewed()) return;
    const id = slotIdentity(target);
    const selection = new Set(this.selected());
    if (checked) selection.add(id);
    else selection.delete(id);
    this.selected.set(selection);
  }

  review(): void {
    const snapshot = this.snapshot();
    if (!snapshot || !this.canReview()) return;
    const selection: SlotSelection = {
      expectedRevision: snapshot.revision,
      basis: snapshot.basis,
      selectedTargets: snapshot.targets.filter(target => target.eligible && this.selected().has(slotIdentity(target)))
        .map(({ targetType, targetId }) => ({ targetType, targetId }))
    };
    if (selection.selectedTargets.length !== snapshot.requiredCount) return;
    this.busy.set(true);
    this.error.set('');
    this.api.preview(selection).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false))
    ).subscribe({
      next: allocation => this.reviewed.set({ allocation, selection }),
      error: response => this.onError(response)
    });
  }

  save(): void {
    const reviewed = this.reviewed();
    if (!reviewed || this.busy() || this.stale()) return;
    this.busy.set(true);
    this.error.set('');
    this.api.save(reviewed.selection).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.busy.set(false))
    ).subscribe({
      next: () => {
        this.markedStale.set(true);
        void this.router.navigate([this.people.route], { state: { savedTrustSlots: true } });
      },
      error: response => this.onError(response)
    });
  }

  text(key: keyof typeof copy): string { return this.language.resolveText(copy[key]); }
  title(): string { return this.language.resolveText(this.people.label); }
  date(value: string): string { return trustDate(value, this.language.getLang$i()); }
  deadline(value: string): string { return this.text('deadline').replace('{date}', () => this.date(value)); }
  remaining(value: string): string {
    return this.text('remaining').replace('{time}', () => trustTimeLeft(value, this.currentTime(), this.language.getLang$i()));
  }

  summary(snapshot: SlotAllocation): string {
    return this.text('allocationSummary')
      .replace('{selected}', String(this.selected().size))
      .replace('{required}', String(snapshot.requiredCount))
      .replace('{grace}', String(snapshot.graceCount));
  }

  transferText(change: SlotAllocation['changes'][number]): string {
    const targets = this.snapshot()?.targets ?? [];
    const name = (identity: typeof change.from) => targets.find(target => slotIdentity(target) === slotIdentity(identity))?.name ?? '—';
    return this.text('deadlineTransfer')
      .replace('{from}', () => name(change.from))
      .replace('{to}', () => name(change.to))
      .replace('{date}', () => this.date(change.graceEndsAt));
  }

  private onError(response: HttpErrorResponse): void {
    const conflict = response.status === 409 || response.status === 400;
    this.markedStale.set(conflict || !!this.reviewed());
    this.error.set(this.text(response.error?.error === 'trust_allocation_no_grace' ? 'noGrace'
      : conflict ? 'allocationStale' : 'allocationError'));
  }
}
