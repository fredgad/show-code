export type TrustTargetType = 'user' | 'organization';
export type TrustAllocationState = 'allocated' | 'grace' | 'suspended' | 'manual_unallocated';

export interface TrustPolicy {
  allocationState: TrustAllocationState;
  peerAllocationState: TrustAllocationState;
  manualPausedAt: string | null;
  peerManualPausedAt: string | null;
  graceEndsAt: string | null;
  access: {
    sharesMyData: boolean;
    sharesMyDataReason: string;
    receivesTheirData: boolean;
    receivesTheirDataReason: string;
  };
  actions: {
    canPause: boolean;
    canResume: boolean;
    canDonateSlot: boolean;
    canReceiveSlot: boolean;
    canRemove: boolean;
  };
}
