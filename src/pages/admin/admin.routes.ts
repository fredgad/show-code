import type { Routes } from '@angular/router';
import { AdminAnalyticsComponent } from './admin-analytics.component';
import { AdminRecordsComponent } from './admin-records.component';
import { AdminShellComponent } from './admin-shell.component';

const loadAccountBilling = () => import('../profile/billing/billing.component').then(module => module.BillingComponent);

export const adminRoutes: Routes = [{
  path: '',
  component: AdminShellComponent,
  children: [
    { path: '', pathMatch: 'full', redirectTo: 'payments' },
    { path: 'users', component: AdminRecordsComponent, data: { section: 'users' } },
    { path: 'payments', pathMatch: 'full', component: AdminRecordsComponent, data: { section: 'payments' } },
    { path: 'payments/access', loadComponent: loadAccountBilling, data: { billingAdmin: true } },
    { path: 'payments/access/:ownerId', loadComponent: loadAccountBilling, data: { billingAdmin: true } },
    { path: 'audit', component: AdminRecordsComponent, data: { section: 'audit' } },
    { path: 'analytics', pathMatch: 'full', redirectTo: 'analytics/site' },
    { path: 'analytics/site', component: AdminAnalyticsComponent, data: { source: 'site' } },
    { path: 'analytics/app', component: AdminAnalyticsComponent, data: { source: 'app' } },
  ],
}];
