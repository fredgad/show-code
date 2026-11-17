import { Route } from '@angular/router';
import { ProfileOverviewComponent } from '@pages';
import { NotificationSettingsComponent } from '@widgets/notification-settings';
import { AccountSettingsComponent } from '@widgets/account-settings';
import { AuthGuard, pendingChangesGuard } from '@shared/guards';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('../pages/landing/landing.component').then(x => x.LandingComponent)
  },
  {
    path: 'landing',
    pathMatch: 'full',
    redirectTo: ''
  },
  {
    path: 'landing-demo',
    pathMatch: 'full',
    redirectTo: ''
  },
  {
    path: 'auth',
    loadComponent: () => import('@pages').then(x => x.AuthorizationComponent)
  },
  {
    path: 'registration',
    loadComponent: () => import('@pages').then(x => x.RegistrationComponent)
  },
  {
    path: 'password-recovery',
    loadComponent: () => import('../pages/password-recovery').then(x => x.PasswordRecoveryComponent)
  },
  {
    path: 'verify',
    loadComponent: () => import('../pages/verify').then(x => x.VerifyComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('../pages/admin/admin.routes').then(module => module.adminRoutes)
  },
  { path: 'profile/admin/billing', pathMatch: 'full', redirectTo: '/admin/payments/access' },
  {
    path: 'profile',
    loadComponent: () => import('@pages').then(x => x.ProfileComponent),
    children: [
      { path: '', component: ProfileOverviewComponent, pathMatch: 'full' },
      {
        path: 'vault',
        loadComponent: () => import('../pages/profile/vault/profile-vault.component').then(x => x.ProfileVaultComponent)
      },
      { path: 'saved-media', pathMatch: 'full', redirectTo: 'vault' },
      {
        path: 'trusted-people/slots',
        loadComponent: () => import('../widgets/trusted-people/access/trusted-slot-allocation.component')
          .then(x => x.TrustedSlotAllocationComponent)
      },
      {
        path: 'trusted-people',
        loadComponent: () => import('@widgets/trusted-people').then(x => x.TrustedPeopleComponent)
      },
      { path: 'requests', pathMatch: 'full', redirectTo: '/profile/trusted-people?requests=incoming' },
      { path: 'requests/incoming', pathMatch: 'full', redirectTo: '/profile/trusted-people?requests=incoming' },
      { path: 'requests/outgoing', pathMatch: 'full', redirectTo: '/profile/trusted-people?requests=outgoing' },
      { path: 'notification-settings', component: NotificationSettingsComponent },
      { path: 'account-settings', component: AccountSettingsComponent },
      {
        path: 'billing',
        loadComponent: () => import('../pages/profile/billing/billing.component').then(x => x.BillingComponent)
      }
    ],
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('@pages').then(x => x.SettingsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'trusted-profile/:keyId',
    loadComponent: () => import('../pages/trusted-profile').then(x => x.TrustedProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'trusted-organization/:trustedTargetId',
    loadComponent: () => import('../pages/trusted-organization/trusted-organization.component')
      .then(x => x.TrustedOrganizationComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'capture',
    loadComponent: () => import('@pages').then(x => x.VideoPageComponent),
    canActivate: [AuthGuard],
    canDeactivate: [pendingChangesGuard]
  }
];
