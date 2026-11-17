import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_API_URL } from '@shared/constants';
import { TrustPolicy } from '../../shared/interfaces/trust-policy.interfaces';

export interface TrustedOrganizationRelationship {
  trustedTargetId: string;
  organizationId: string;
  status: 'active' | 'pending';
  requestRevision: string | null;
  contractId: string | null;
  contractRequired: boolean;
  contract: { contractId: string; snapshotHash: string } | null;
  organization: { name: string; publicKeyId: string; description: string; logoUrl: string | null } | null;
  createdAt: string | null;
  respondedAt: string | null;
  trustPolicy: TrustPolicy | null;
}

export interface TrustedOrganizationAccount {
  trustedOrganizations?: TrustedOrganizationRelationship[] | null;
  incomingOrganizationTrustRequests?: TrustedOrganizationRelationship[] | null;
  organizationTrustRequests?: TrustedOrganizationRelationship[] | null;
}

type RequestContract = { contractId: string; snapshotHash: string } | { noContract: true };

export function organizationLogoUrl(value?: string | null): string | null {
  const source = value?.trim();
  if (!source) return null;
  if (/^https?:\/\//i.test(source)) return source;
  if (/^\/api\/public\/organization-logos\/[a-z\d_-]+$/i.test(source)) return `${APP_API_URL}${source}`;
  if (/^data:image\/(?:png|jpe?g|gif|webp|bmp);base64,/i.test(source)) return source;
  if (/^[a-z\d+/]+={0,2}$/i.test(source)) return `data:image/png;base64,${source}`;
  return null;
}

export function organizationHasContract(relationship: TrustedOrganizationRelationship): boolean {
  return Boolean(relationship.contractRequired || relationship.contractId || relationship.contract);
}

@Injectable({ providedIn: 'root' })
export class TrustedOrganizationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${APP_API_URL}/api/user`;

  account() {
    return this.http.get<TrustedOrganizationAccount>(`${this.base}/me`);
  }

  respond(relationship: TrustedOrganizationRelationship, action: 'accept' | 'decline', contract: RequestContract) {
    return this.http.post<{ message?: string }>(`${this.relationshipUrl(relationship)}/${action}`, {
      requestRevision: relationship.requestRevision,
      ...contract
    });
  }

  remove(relationship: TrustedOrganizationRelationship) {
    return this.http.delete<{ message?: string }>(this.relationshipUrl(relationship), {
      body: { requestRevision: relationship.requestRevision }
    });
  }

  private relationshipUrl(relationship: TrustedOrganizationRelationship): string {
    return `${this.base}/trusted-organizations/${encodeURIComponent(relationship.trustedTargetId)}`;
  }
}
