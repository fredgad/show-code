import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_API_URL } from '@shared/constants';
import type { TrustAllocationState, TrustPolicy, TrustTargetType } from '../../../shared/interfaces/trust-policy.interfaces';
import { map } from 'rxjs';

export interface TrustContact {
  targetType: TrustTargetType;
  keyId: string;
  username: string;
  email?: string;
  image?: string | null;
  policy?: TrustPolicy;
  trustedTargetId?: string;
}

interface TrustSummary {
  revision: number;
  combinedLimit: number | null;
  allocatedCount: number;
  graceCount: number;
  nextDeadlineAt: string | null;
}

interface CatalogResponse {
  summary: TrustSummary;
  relationships: (TrustPolicy & {
    peer: { keyId: string; username: string; email: string; image: string | null };
  })[];
  organizations: {
    targetKeyId: string;
    trustedTargetId?: string;
    policy: TrustPolicy & { organization: { name: string; logoUrl: string | null } };
  }[];
}

export interface OperatorInvitation {
  inviteId: string;
  organization: {
    name: string;
    publicKeyId: string;
    logoUrl: string | null;
  } | null;
}

export interface TrustCatalog {
  summary: TrustSummary;
  contacts: TrustContact[];
  clockOffset: number;
}

interface SlotIdentity {
  targetType: TrustTargetType;
  targetId: string;
}

export interface SlotTarget extends SlotIdentity {
  name: string;
  keyId: string;
  allocationState: TrustAllocationState;
  eligible: boolean;
  selected: boolean;
  manualPausedAt: string | null;
  graceEndsAt: string | null;
}

export interface SlotAllocation {
  revision: number;
  basis: string;
  serverNow: string;
  requiredCount: number;
  graceCount: number;
  targets: SlotTarget[];
  changes: { from: SlotIdentity; to: SlotIdentity; graceEndsAt: string }[];
}

export interface SlotSelection {
  expectedRevision: number;
  basis: string;
  selectedTargets: SlotIdentity[];
}

export function slotIdentity(target: SlotIdentity): string {
  return `${target.targetType}:${target.targetId}`;
}

export function contactIdentity(contact: TrustContact): string {
  return `${contact.targetType}:${contact.keyId}`;
}

@Injectable({ providedIn: 'root' })
export class TrustAccessApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_API_URL}/api/trust`;

  catalog() {
    return this.http.get<CatalogResponse>(`${this.base}/relationships`, { observe: 'response' }).pipe(
      map(response => this.catalogResult(response.body!, response.headers.get('Date')))
    );
  }

  operatorInvitations() {
    return this.http.get<{ invitations: OperatorInvitation[] }>(`${APP_API_URL}/api/user/organization-invites`).pipe(
      map(response => response.invitations)
    );
  }

  respondToOperatorInvitation(inviteId: string, response: 'accept' | 'decline') {
    return this.http.post<void>(
      `${APP_API_URL}/api/user/organization-invites/${encodeURIComponent(inviteId)}/${response}`, {}
    );
  }

  changeAccess(action: 'pause' | 'resume' | 'transfer-slot', target: TrustContact, revision: number, donor?: TrustContact) {
    const keyId = encodeURIComponent(target.keyId);
    return this.http.post<CatalogResponse>(`${this.base}/relationships/${keyId}/${action}`, {
      expectedRevision: revision,
      targetType: target.targetType,
      ...(donor && { donorKeyId: donor.keyId, donorTargetType: donor.targetType })
    }, { observe: 'response' }).pipe(
      map(response => this.catalogResult(response.body!, response.headers.get('Date')))
    );
  }

  allocation() {
    return this.http.get<{ allocation: SlotAllocation }>(`${this.base}/slot-allocation`).pipe(map(result => result.allocation));
  }

  preview(selection: SlotSelection) {
    return this.http.post<{ allocation: SlotAllocation }>(`${this.base}/slot-allocation/preview`, selection)
      .pipe(map(result => result.allocation));
  }

  save(selection: SlotSelection) {
    return this.http.post<{ allocation: SlotAllocation }>(`${this.base}/slot-allocation`, selection)
      .pipe(map(result => result.allocation));
  }

  private catalogResult(data: CatalogResponse, date: string | null): TrustCatalog {
    const serverTime = Date.parse(date ?? '');
    const organizations = (data.organizations ?? []).map(({ targetKeyId, trustedTargetId, policy }): TrustContact => ({
      targetType: 'organization', keyId: targetKeyId, trustedTargetId, username: policy.organization.name,
      image: policy.organization.logoUrl, policy
    }));
    const people = data.relationships.map(({ peer, ...policy }): TrustContact => ({
      targetType: 'user', ...peer, policy
    }));
    return {
      summary: data.summary,
      contacts: [...organizations, ...people],
      clockOffset: Number.isFinite(serverTime) ? serverTime - Date.now() : 0
    };
  }
}
