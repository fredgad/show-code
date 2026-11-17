import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { APP_API_URL } from '@shared/constants';
import { filter, map } from 'rxjs';

export interface ContractIdentity {
  contractId: string;
  snapshotHash: string;
}

export interface ContractDocument {
  filename: string;
  contentType: string;
  size: number;
}

interface SignedCopy extends ContractDocument {
  originalName: string | null;
  uploadedAt: string | null;
  reviewedAt: string | null;
  rejectionNote: string | null;
}

interface SignedCopyVersion extends SignedCopy {
  uploadAttemptId: string;
  status: 'rejected' | 'superseded' | 'approved';
  archivedAt: string | null;
}

interface OrganizationParty {
  fullName?: string;
  publicKeyId?: string;
  legalAddress?: string;
  taxId?: string;
  registrationNumber?: string;
  representativeName?: string;
  representativeBasis?: string;
  contactEmail?: string;
}

interface UserParty {
  username?: string;
  keyId?: string;
  email?: string;
}

export type ContractStatus = 'sent' | 'viewed' | 'terms_confirmed' | 'awaiting_signed_copy'
  | 'signed_copy_uploaded' | 'approved' | 'reupload_required' | 'declined' | 'cancelled';

export interface OrganizationContract extends ContractIdentity {
  number: string;
  title: string;
  language: string;
  mode: 'confirmation_only' | 'signed_copy_required';
  status: ContractStatus;
  isCurrent: boolean;
  trustStatus: string | null;
  templateVersion: number;
  sentAt: string | null;
  viewedAt: string | null;
  termsConfirmedAt: string | null;
  sourceDownloadedAt: string | null;
  approvedAt: string | null;
  organizationParty: OrganizationParty | null;
  userParty: UserParty | null;
  content?: { preamble?: string; body?: string; confirmationText?: string };
  sections?: { key: string; title: string; text: string }[];
  services: { code: string; label: string; description: string; selected: boolean }[];
  price: { amount: number | null; currency: string; description: string } | null;
  startDate: string | null;
  endDate: string | null;
  additionalTerms?: string;
  sourceDocument: ContractDocument | null;
  signedCopy: SignedCopy | null;
  signedCopyVersions: SignedCopyVersion[];
  progress: {
    viewed: boolean;
    termsConfirmed: boolean;
    sourceDownloaded: boolean;
    signedCopyUploaded: boolean;
    approved: boolean;
  };
  actions: {
    canMarkViewed: boolean;
    canConfirmTerms: boolean;
    canDownloadSource: boolean;
    canUploadSignedCopy: boolean;
    canAcceptTrust: boolean;
  };
}

export type ContractDocumentKind = 'source' | 'signed-copy' | { uploadAttemptId: string };
type ContractResponse = { contract: OrganizationContract };

@Injectable({ providedIn: 'root' })
export class OrganizationContractsApiService {
  private readonly http = inject(HttpClient);

  list(trustedTargetId: string) {
    return this.http.get<{ contracts: OrganizationContract[] }>(`${this.base(trustedTargetId)}/contracts`).pipe(
      map(response => response.contracts)
    );
  }

  markViewed(trustedTargetId: string, identity: ContractIdentity) {
    return this.post(trustedTargetId, 'viewed', identity);
  }

  confirm(trustedTargetId: string, identity: ContractIdentity) {
    return this.post(trustedTargetId, 'confirm', identity);
  }

  upload(trustedTargetId: string, { contractId, snapshotHash }: ContractIdentity, file: File) {
    const form = new FormData();
    form.append('contractId', contractId);
    form.append('snapshotHash', snapshotHash);
    form.append('file', file, file.name);
    return this.http.post<ContractResponse>(`${this.base(trustedTargetId)}/contract/signed-copy`, form, {
      observe: 'events', reportProgress: true
    }).pipe(
      filter((event): event is HttpResponse<ContractResponse> => event.type === HttpEventType.Response),
      map(response => response.body!.contract)
    );
  }

  download(trustedTargetId: string, { contractId, snapshotHash }: ContractIdentity, document: ContractDocumentKind) {
    const path = typeof document === 'string' ? document : `signed-copies/${encodeURIComponent(document.uploadAttemptId)}`;
    return this.http.get(`${this.base(trustedTargetId)}/contract/${path}`, {
      params: { contractId, snapshotHash }, responseType: 'blob', reportProgress: true
    });
  }

  private post(trustedTargetId: string, path: string, { contractId, snapshotHash }: ContractIdentity) {
    return this.http.post<ContractResponse>(`${this.base(trustedTargetId)}/contract/${path}`, { contractId, snapshotHash }).pipe(
      map(response => response.contract)
    );
  }

  private base(trustedTargetId: string): string {
    return `${APP_API_URL}/api/user/trusted-organizations/${encodeURIComponent(trustedTargetId)}`;
  }
}
