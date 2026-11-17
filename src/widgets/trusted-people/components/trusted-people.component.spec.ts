import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LangTextI, StoreUserIN } from '@shared/interfaces';
import { AuthService, LangService } from '@shared/services';
import { AppStoreFacade } from '@store';
import { BehaviorSubject, of } from 'rxjs';
import { TrustedOrganizationApiService, TrustedOrganizationRelationship } from '../../../pages/trusted-organization/trusted-organization.api';
import { TrustAccessApiService } from '../access/trust-access-api.service';
import { TrustedPeopleComponent } from './trusted-people.component';

describe('TrustedPeopleComponent', () => {
  const route = '/profile/trusted-people';
  let harness: RouterTestingHarness;
  let cancelRequest: jest.Mock;
  let operatorInvitations: jest.Mock;
  let respondToOperatorInvitation: jest.Mock;
  let account: BehaviorSubject<Partial<StoreUserIN>>;

  beforeEach(async () => {
    cancelRequest = jest.fn(() => of({}));
    operatorInvitations = jest.fn(() => of([]));
    respondToOperatorInvitation = jest.fn(() => of({}));
    account = new BehaviorSubject<Partial<StoreUserIN>>({ incomingReq: ['inbound'], outgoingReq: [] });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'profile/trusted-people', component: TrustedPeopleComponent }]),
        { provide: LangService, useValue: { resolveText: (label: LangTextI) => label.ENG } },
        {
          provide: AuthService,
          useValue: {
            getTrustedUsersByKeyIds: () => of([{ keyId: 'inbound', username: 'Incoming contact' }]),
            cancelRequest
          }
        },
        { provide: TrustAccessApiService, useValue: { catalog: () => of(null), operatorInvitations, respondToOperatorInvitation } },
        { provide: TrustedOrganizationApiService, useValue: {} },
        {
          provide: AppStoreFacade,
          useValue: {
            userData$: account,
            trustedPeople$: of([]),
            userLoadStatus$: of('ready'),
            getUserData: jest.fn()
          }
        }
      ]
    });
    harness = await RouterTestingHarness.create();
  });

  it('shows names and counts in the request tabs on the same page', async () => {
    await harness.navigateByUrl(route + '?requests=incoming', TrustedPeopleComponent);
    const content = harness.routeNativeElement!;
    expect(content.querySelector('.segments')?.textContent).toContain('Requests 1');
    expect(content.querySelector('.person-details h2')?.textContent?.trim()).toBe('Incoming contact');
    expect(content.querySelector('[aria-haspopup="dialog"]')?.textContent?.trim()).toBe('Decline');

    await harness.navigateByUrl(route + '?requests=outgoing', TrustedPeopleComponent);
    expect(content.querySelector('.empty h2')?.textContent?.trim()).toBe('No outgoing requests');
  });

  it('declines an incoming request with the incoming direction', async () => {
    const component = await harness.navigateByUrl(route + '?requests=incoming', TrustedPeopleComponent);
    const dialog = { showModal: jest.fn(), close: jest.fn() } as unknown as HTMLDialogElement;
    component.openConfirmation(dialog, 'decline', { keyId: 'inbound', username: 'Incoming contact', targetType: 'user' });
    component.submitConfirmation(new Event('submit') as SubmitEvent, dialog);

    expect(cancelRequest).toHaveBeenCalledWith('inbound', 'incoming');
    expect(dialog.close).toHaveBeenCalled();
    expect(component.notice()).toBe('Request declined.');
  });

  it('opens a contract-bound request by relationship ID and counts operator invitations separately', async () => {
    const pending: TrustedOrganizationRelationship = {
      trustedTargetId: 'target-a', organizationId: 'org-a', status: 'pending', requestRevision: 'revision-a',
      contractId: 'contract-a', contractRequired: true, contract: null,
      organization: { name: 'Rescue team', publicKeyId: 'org_rescue', description: '', logoUrl: null },
      createdAt: null, respondedAt: null, trustPolicy: null
    };
    account.next({ ...account.value, incomingOrganizationTrustRequests: [pending] });
    operatorInvitations.mockReturnValue(of([{ inviteId: 'operator-a', organization: pending.organization }]));

    const component = await harness.navigateByUrl(route + '?requests=incoming', TrustedPeopleComponent);
    const content = harness.routeNativeElement!;
    expect(content.querySelector('.request-directions a')?.textContent).toContain('Incoming 3');
    const contractLink = content.querySelector<HTMLAnchorElement>('.person-card a.button');
    expect(contractLink?.getAttribute('href')).toBe('/trusted-organization/target-a');
    expect(contractLink?.textContent?.trim()).toBe('Open contract');
    expect(contractLink?.closest('li')?.querySelector('button.primary')).toBeNull();

    const dialog = { showModal: jest.fn(), close: jest.fn() } as unknown as HTMLDialogElement;
    const invitation = component.visiblePeople().find(person => person.operatorInviteId === 'operator-a')!;
    component.openConfirmation(dialog, 'accept', invitation);
    component.submitConfirmation(new Event('submit') as SubmitEvent, dialog);
    expect(respondToOperatorInvitation).toHaveBeenCalledWith('operator-a', 'accept');
    expect(component.notice()).toBe('Operator invitation accepted.');
  });
});
