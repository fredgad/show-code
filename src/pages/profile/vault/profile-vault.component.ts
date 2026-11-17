import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AuthService, LangService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { Observable, Subject, catchError, finalize, of, switchMap, timer } from 'rxjs';
import { PROFILE_NAVIGATION } from '../profile-navigation';
import { billingLocales, billingText } from '../billing/billing.text';
import { VaultActionsComponent } from './vault-actions.component';
import { VaultApiService } from './vault-api.service';
import { VaultPosterComponent } from './vault-poster.component';
import { VaultPlayerComponent } from './vault-player.component';
import { VaultFolder, VaultFolderLayout, VaultFragmentInput, VaultItem, VaultQuota, isVaultMediaAvailable } from './vault.models';
import { vaultText } from './vault.text';

type FolderAction = { kind: 'create' } | { kind: 'rename' | 'delete'; folder: VaultFolder };
type FolderSelection = string | null | undefined;

@Component({
  selector: 'org-profile-vault',
  standalone: true,
  imports: [VaultActionsComponent, VaultPlayerComponent, VaultPosterComponent],
  templateUrl: './profile-vault.component.html',
  styleUrl: './profile-vault.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileVaultComponent implements OnInit {
  private readonly api = inject(VaultApiService);
  private readonly auth = inject(AuthService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);
  private readonly language = inject(LangService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(AppStoreFacade);
  private readonly user = toSignal(this.store.userData$);
  private readonly reloadItems = new Subject<void>();
  private readonly reloadFolders = new Subject<void>();
  private readonly items = signal<VaultItem[]>([]);
  private readonly locale = computed(() => billingLocales[this.language.getLang$i()]);
  private readonly dateFormat = computed(() => new Intl.DateTimeFormat(this.locale(), {
    dateStyle: 'medium', timeStyle: 'short'
  }));
  private readonly numberFormat = computed(() => new Intl.NumberFormat(this.locale(), { maximumFractionDigits: 1 }));

  @ViewChild('folderDialog', { static: true }) private folderDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('playerDialog', { static: true }) private playerDialog!: ElementRef<HTMLDialogElement>;

  readonly tab = signal<'recording' | 'saved'>('recording');
  readonly view = signal<'all' | 'folders'>('all');
  readonly folderSelection = signal<FolderSelection>(undefined);
  readonly folders = signal<VaultFolder[]>([]);
  readonly layoutOverride = signal<VaultFolderLayout | null>(null);
  readonly folderLayout = computed(() => this.layoutOverride() ?? this.user()?.preferences?.vaultFolderLayout ?? 'grid');
  readonly folderSearch = signal('');
  readonly titleSearch = signal('');
  readonly ownership = signal('all');
  readonly kind = signal('all');
  readonly sort = signal('newest');
  readonly folderAction = signal<FolderAction | null>(null);
  readonly folderName = signal('');
  readonly folderPending = signal(false);
  readonly layoutPending = signal(false);
  readonly folderError = signal<string | null>(null);
  readonly playerItem = signal<VaultItem | null>(null);
  readonly trimming = signal(false);
  readonly trimPending = signal(false);
  readonly trimError = signal<string | null>(null);
  readonly notice = signal('');
  readonly quota = signal<VaultQuota | null>(null);
  readonly itemsLoading = signal(false);
  readonly itemsError = signal(false);
  readonly foldersLoading = signal(false);
  readonly foldersError = signal(false);
  readonly requiresPassword = computed(() => !!this.user()?.deletionPasswordRequired);
  readonly recordings = computed(() => this.items().filter(item => item.itemType === 'recording'));
  readonly saved = computed(() => this.items().filter(item => item.itemType === 'saved'));
  readonly visibleFolders = computed(() => {
    const query = this.folderSearch().trim().toLowerCase();
    return this.folders().filter(folder => folder.name.toLowerCase().includes(query));
  });
  readonly showUngrouped = computed(() => this.t('ungrouped').toLowerCase().includes(this.folderSearch().trim().toLowerCase()));
  readonly folderCounts = computed(() => {
    const counts = new Map<string | null, number>();
    for (const item of this.saved()) {
      const key = item.folderId || null;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  });
  readonly selectedFolderName = computed(() => this.folderSelection() === null
    ? this.t('ungrouped')
    : this.folders().find(folder => folder.folderId === this.folderSelection())?.name ?? this.t('folders'));
  readonly visibleItems = computed(() => {
    if (this.tab() === 'recording') return this.recordings();
    const saved = this.saved();
    const folder = this.folderSelection();
    if (this.view() === 'folders' && folder !== undefined) {
      return this.sortSaved(saved.filter(item => (item.folderId || null) === folder), true);
    }
    const title = this.titleSearch().trim().toLowerCase();
    const filtered = saved.filter(item =>
      (this.ownership() === 'all' || this.isAdded(item) === (this.ownership() === 'added')) &&
      (this.kind() === 'all' || this.itemKind(item) === this.kind()) &&
      (!title || (item.customTitle || '').toLowerCase().includes(title))
    );
    return this.sortSaved(filtered, this.sort() === 'newest');
  });
  readonly canPlay = isVaultMediaAvailable;

  constructor() {
    effect(onCleanup => {
      if (!this.items().some(item => this.shouldPoll(item))) return;
      const poll = timer(5000, 5000).subscribe(() => {
        if (this.document.visibilityState !== 'hidden' && !this.itemsLoading()) this.reloadItems.next();
      });
      onCleanup(() => poll.unsubscribe());
    });
  }

  ngOnInit(): void {
    this.reloadItems.pipe(
      switchMap(() => {
        this.itemsLoading.set(true);
        this.itemsError.set(false);
        return this.api.items().pipe(catchError(() => of(null)), finalize(() => this.itemsLoading.set(false)));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (!result) {
        this.itemsError.set(true);
        return;
      }
      this.items.set(result.items);
      this.quota.set(result.quota ?? null);
    });

    this.reloadFolders.pipe(
      switchMap(() => {
        this.foldersLoading.set(true);
        this.foldersError.set(false);
        return this.api.folders().pipe(catchError(() => of(null)), finalize(() => this.foldersLoading.set(false)));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(folders => {
      if (!folders) {
        this.foldersError.set(true);
        return;
      }
      this.folders.set(folders);
      const selected = this.folderSelection();
      if (selected && !folders.some(folder => folder.folderId === selected)) this.folderSelection.set(undefined);
    });

    this.refresh();
  }

  t(key: keyof typeof vaultText): string {
    return this.language.resolveText(vaultText[key]);
  }

  title(): string {
    return this.language.resolveText(PROFILE_NAVIGATION.vault.label);
  }

  key(item: VaultItem): string {
    return item.vaultEntryId || item.recordingId || item.playbackId || item.url || '';
  }

  itemTitle(item: VaultItem): string {
    return item.customTitle || this.t(this.itemKind(item));
  }

  origin(item: VaultItem): string {
    if (item.cameraRecordingId || item.captureOrigin?.cameraRecordingId) {
      return this.t(item.recordingPurpose === 'camera_manual' ? 'cameraRecording' : 'cameraEmergency');
    }
    if (item.itemType === 'recording') return '';
    return this.t(this.isAdded(item) ? 'added' : 'own');
  }

  evidence(item: VaultItem): string {
    if (item.processingStatus === 'processing') return this.t('processing');
    if (item.evidenceStatus === 'sealed') return this.t('sealed');
    if (item.evidenceStatus === 'pending') return this.t('pending');
    if (item.evidenceStatus === 'failed') return this.t('failed');
    return '';
  }

  date(value?: string | null): string {
    return value && Number.isFinite(Date.parse(value)) ? this.dateFormat().format(new Date(value)) : '';
  }

  duration(seconds: number): string {
    const rounded = Math.max(0, Math.floor(seconds));
    return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
  }

  bytes(value: number): string {
    const gib = value >= 1_073_741_824;
    const amount = this.numberFormat().format(value / (gib ? 1_073_741_824 : 1_048_576));
    return `${amount} ${this.language.resolveText(billingText[gib ? 'gib' : 'mib'])}`;
  }

  refresh(): void {
    this.reloadItems.next();
    this.reloadFolders.next();
  }

  setView(view: 'all' | 'folders'): void {
    this.view.set(view);
    this.folderSelection.set(undefined);
  }

  resetFilters(): void {
    this.titleSearch.set('');
    this.ownership.set('all');
    this.kind.set('all');
    this.sort.set('newest');
  }

  setLayout(layout: VaultFolderLayout): void {
    if (this.layoutPending() || layout === this.folderLayout()) return;
    this.layoutPending.set(true);
    this.auth.updateVaultFolderLayout(layout).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.layoutPending.set(false))
    ).subscribe({
      next: () => {
        this.layoutOverride.set(layout);
        this.store.getUserData();
      },
      error: () => this.notice.set(this.t('layoutError'))
    });
  }

  openFolderAction(kind: 'create' | 'rename' | 'delete', folder?: VaultFolder): void {
    if (kind !== 'create' && !folder) return;
    this.folderError.set(null);
    this.folderName.set(folder?.name || '');
    this.folderAction.set(kind === 'create' ? { kind } : { kind, folder: folder! });
    this.changeDetector.detectChanges();
    this.folderDialog.nativeElement.showModal();
  }

  saveFolder(event: Event): void {
    event.preventDefault();
    const action = this.folderAction();
    const name = this.folderName().trim();
    if (!action || this.folderPending() || (action.kind !== 'delete' && !name)) return;
    let request: Observable<unknown>;
    switch (action.kind) {
      case 'create': request = this.api.createFolder(name); break;
      case 'rename': request = this.api.renameFolder(action.folder.folderId, name); break;
      case 'delete': request = this.api.deleteFolder(action.folder.folderId); break;
    }
    this.folderPending.set(true);
    this.folderError.set(null);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.folderPending.set(false))).subscribe({
      next: () => {
        this.folderDialog.nativeElement.close();
        this.refresh();
      },
      error: (error: HttpErrorResponse) => {
        const code = error.error?.error;
        this.folderError.set(this.t(code === 'vault_folder_duplicate' ? 'folderDuplicate'
          : code === 'vault_folder_limit_reached' ? 'folderLimit' : 'actionError'));
      }
    });
  }

  openPlayer(item: VaultItem, trim = false): void {
    if (!this.canPlay(item)) return;
    this.playerItem.set(item);
    this.trimming.set(trim);
    this.trimError.set(null);
    this.changeDetector.detectChanges();
    this.playerDialog.nativeElement.showModal();
  }

  saveFragment(input: VaultFragmentInput): void {
    const entryId = this.playerItem()?.vaultEntryId;
    if (!entryId || this.trimPending()) return;
    this.trimPending.set(true);
    this.trimError.set(null);
    this.api.createFragment(entryId, input).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.trimPending.set(false))
    ).subscribe({
      next: () => {
        this.playerDialog.nativeElement.close();
        this.tab.set('saved');
        this.setView('all');
        this.resetFilters();
        this.notice.set(this.t('fragmentQueued'));
        this.refresh();
      },
      error: (error: HttpErrorResponse) => {
        const code = error.error?.error;
        this.trimError.set(this.t(code === 'vault_quota_exceeded' ? 'quotaError'
          : code === 'vault_fragment_source_changed' ? 'sourceChanged'
          : code === 'vault_fragment_already_processing' ? 'fragmentBusy'
          : code === 'vault_fragment_rate_limited' ? 'fragmentLimit' : 'actionError'));
        if (error.status === 409) this.reloadItems.next();
      }
    });
  }

  private isAdded(item: VaultItem): boolean {
    return item.sourceType === 'imported_verified' || item.originType === 'imported_verified';
  }

  private itemKind(item: VaultItem): 'recording' | 'fragment' | 'qrCopy' {
    if (item.derivationType === 'qr_watermark') return 'qrCopy';
    if (item.derivationType === 'trim' || item.sourceType === 'derived_verified') return 'fragment';
    return 'recording';
  }

  private shouldPoll(item: VaultItem): boolean {
    return item.processingStatus === 'processing' || (!!item.captureRecovery?.recordingChainId &&
      (item.captureRecovery.completeness === 'uploading' || !!item.captureRecovery.updateBlocked || item.evidenceStatus === 'pending'));
  }

  private sortSaved(items: VaultItem[], newest: boolean): VaultItem[] {
    const time = (item: VaultItem) => Date.parse(item.savedAt || item.fragment?.transformedAt ||
      item.qrWatermark?.transformedAt || item.createdAt || '') || 0;
    return items.sort((a, b) => newest ? time(b) - time(a) : time(a) - time(b));
  }
}
