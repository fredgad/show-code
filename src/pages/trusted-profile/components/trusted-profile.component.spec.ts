import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService, LangService } from '@shared/services';
import { LangEnum, LangTextI } from '@shared/interfaces';
import { HeaderComponent } from '@widgets/header';
import { MockBuilder } from 'ng-mocks';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { TrustAccessApiService, TrustCatalog } from '../../../widgets/trusted-people/access/trust-access-api.service';
import { TrustedAccessSettingsComponent } from '../../../widgets/trusted-people/access/trusted-access-settings.component';
import { VaultApiService } from '../../profile/vault/vault-api.service';
import { VaultPlayerComponent } from '../../profile/vault/vault-player.component';
import { RecordingMessage, TrustedProfileContentService } from './trusted-profile-content.service';
import { TrustedProfileComponent } from './trusted-profile.component';
import { TrustedRecordCardComponent } from './trusted-record-card.component';

function catalog(keyId: string, receivesTheirData = true, sharesMyData = true): TrustCatalog {
  return {
    summary: { revision: 1, graceCount: 0, allocatedCount: 1, combinedLimit: 5, nextDeadlineAt: null },
    clockOffset: 0,
    contacts: [{
      targetType: 'user',
      keyId,
      username: 'Trusted contact',
      policy: {
        access: {
          receivesTheirData,
          receivesTheirDataReason: receivesTheirData ? 'allowed' : 'manual_pause',
          sharesMyData,
          sharesMyDataReason: sharesMyData ? 'allowed' : 'manual_pause',
        },
        allocationState: 'allocated',
        peerAllocationState: 'allocated',
        manualPausedAt: null,
        peerManualPausedAt: null,
        graceEndsAt: null,
        actions: { canPause: true, canResume: false, canDonateSlot: false, canReceiveSlot: false, canRemove: true },
      },
    }],
  };
}

const video = { mediaAssetId: 'source', evidenceStatus: 'sealed', url: '/media/v1/source.mp4', createdAt: '2026-02-04' };
const message: RecordingMessage = {
  deliveryId: 'delivery', isRead: false, title: 'Verified clip', mediaAssetId: 'message-asset', playbackId: 'message',
  sentAt: '2026-02-04', available: true, mediaUrl: '/media/v1/message.mp4',
};

describe('TrustedProfileComponent', () => {
  let fixture: ComponentFixture<TrustedProfileComponent>;
  let component: TrustedProfileComponent;
  let saveTrustedRecording: jest.Mock;
  let getTrustedUsersByKeyIds: jest.Mock;
  let accessCatalog: jest.Mock;
  let messages: jest.Mock;
  let liveStream: jest.Mock;
  let markRead: jest.Mock;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(() => {
    saveTrustedRecording = jest.fn();
    getTrustedUsersByKeyIds = jest.fn(() => of([]));
    accessCatalog = jest.fn(() => of(catalog('')));
    messages = jest.fn(() => of([message]));
    markRead = jest.fn(() => of(undefined));
    liveStream = jest.fn(() => of(null));
    params = new BehaviorSubject(convertToParamMap({}));
    return MockBuilder(TrustedProfileComponent)
      .keep(CommonModule)
      .keep(RouterTestingModule)
      .mock(HeaderComponent)
      .mock(TrustedAccessSettingsComponent)
      .mock(TrustedRecordCardComponent)
      .mock(VaultPlayerComponent)
      .mock(LangService, { getLang$i: signal(LangEnum.ENG), resolveText: (item?: LangTextI | null) => item?.ENG || '' })
      .mock(AuthService, { getTrustedUsersByKeyIds })
      .mock(TrustAccessApiService, { catalog: accessCatalog })
      .mock(TrustedProfileContentService, { messages, liveStream, markRead })
      .mock(ActivatedRoute, { paramMap: params })
      .mock(VaultApiService, {
        items: () => of({
          items: [{ itemType: 'saved' as const, sourceType: 'imported_verified', sourceMediaAssetId: 'already-saved' }],
          quota: { usedBytes: 0, limitBytes: 0, remainingBytes: 0 },
        }),
        saveTrustedRecording,
      });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TrustedProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const viewer: HTMLDialogElement = fixture.nativeElement.querySelector('dialog.viewer');
    viewer.showModal = () => { viewer.open = true; };
    viewer.close = () => { viewer.open = false; };
  });

  function navigate(keyId: string, access = catalog(keyId), previewAccess = access) {
    getTrustedUsersByKeyIds.mockReturnValue(of([{
      _id: 'sender-id',
      keyId,
      username: 'Trusted contact',
      trustPolicy: previewAccess.contacts[0].policy,
      videos: [video],
    }]));
    accessCatalog.mockReturnValue(of(access));
    params.next(convertToParamMap({ keyId }));
    fixture.detectChanges();
  }

  it('requires fresh incoming permission from the profile and relationship, even when videos are present', () => {
    navigate('blocked', catalog('blocked', false), catalog('blocked', true));

    expect(getTrustedUsersByKeyIds).toHaveBeenCalledWith(['blocked'], false);
    expect(fixture.nativeElement.querySelector('.trusted-access-notice').textContent).toContain('restricted');
    expect(fixture.nativeElement.querySelector('org-trusted-record-card')).toBeNull();
    expect(messages).not.toHaveBeenCalled();
    expect(liveStream).not.toHaveBeenCalled();
  });

  it('fetches archived, live and delivered recordings when only inbound access is open', () => {
    liveStream.mockReturnValue(of({ streamId: 'sos', shareId: 'live-id', startedAt: '2026-02-04' }));
    navigate('incoming', catalog('incoming', true, false));

    expect(fixture.nativeElement.querySelector('.live-card')).not.toBeNull();
    expect(component.archived()).toHaveLength(1);
    expect(component.delivered()[0].item).toMatchObject({ mediaAssetId: 'message-asset', playbackId: 'message' });
    expect(component.unread()).toBe(1);
    expect(messages).toHaveBeenCalledWith('sender-id');
    expect(liveStream).toHaveBeenCalledWith('incoming');
  });

  it('cancels outstanding content after a change in policy and fetches it again when access resumes', () => {
    const pendingMessages = new Subject<RecordingMessage[]>();
    messages.mockReturnValueOnce(pendingMessages);
    navigate('changing');
    expect(component.incoming()).toBe(true);

    const closed = catalog('changing', false);
    accessCatalog.mockReturnValue(of(closed));
    component.accessChanged(closed);
    pendingMessages.next([message]);
    pendingMessages.complete();

    expect(component.incoming()).toBe(false);
    expect(component.delivered()).toEqual([]);
    expect(component.archived()).toEqual([]);

    const open = catalog('changing');
    accessCatalog.mockReturnValue(of(open));
    component.accessChanged(open);
    expect(component.delivered()).toHaveLength(1);
  });

  it('keeps the unavailable message visible while omitting its playback and thumbnail', () => {
    messages.mockReturnValue(of([{ ...message, available: false, thumbnailUrl: '/media/v1/message.jpg' }]));
    navigate('unavailable');

    expect(component.delivered()).toHaveLength(1);
    const [unavailable] = component.delivered();
    expect(unavailable.item).toMatchObject({ url: null, thumbnailUrl: null, playbackId: null, downloadAvailable: false });
    component.openRecording(unavailable, fixture.nativeElement.querySelector('#trusted-tab-sos'));
    expect(markRead).not.toHaveBeenCalled();
  });

  it('keeps a read acknowledgement after an older list snapshot and stops playback on revocation', () => {
    navigate('messages');
    const tab: HTMLButtonElement = fixture.nativeElement.querySelector('#trusted-tab-sos');
    tab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#trusted-tab-messages').getAttribute('aria-selected')).toBe('true');

    component.openRecording(component.delivered()[0], tab);
    expect(markRead).toHaveBeenCalledWith('delivery');
    expect(component.unread()).toBe(0);
    component.refresh();
    expect(component.unread()).toBe(0);

    const closed = catalog('messages', false);
    accessCatalog.mockReturnValue(of(closed));
    component.accessChanged(closed);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog.viewer').open).toBe(false);
    expect(fixture.nativeElement.querySelector('org-vault-player')).toBeNull();
  });

  it('saves a sealed trusted recording once and recognizes existing copies', () => {
    const result = new Subject<{ created: boolean; entryId: string }>();
    saveTrustedRecording.mockReturnValue(result);
    navigate('save');
    expect(component.saveState('already-saved')).toBe('saved');
    component.saveToVault({ ...video, mediaAssetId: 'already-saved' });
    component.saveToVault({ ...video, evidenceStatus: 'pending' });
    component.saveToVault(video);
    component.saveToVault(video);

    expect(saveTrustedRecording.mock.calls).toEqual([['source']]);
    expect(component.saveState('source')).toBe('saving');
    result.next({ created: true, entryId: 'saved-copy' });
    result.complete();
    expect(component.saveState('source')).toBe('saved');
  });
});
