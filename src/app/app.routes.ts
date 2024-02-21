import { Route } from '@angular/router';
import { MainComponent, AuthorizationComponent, RegistrationComponent, ProfileComponent } from '@pages';
import { SavedMediaComponent } from '@widgets/saved-media';
import { NotificationSettingsComponent } from '@widgets/notification-settings';
import { TrustedPeopleComponent } from '@widgets/trusted-people';

export const appRoutes: Route[] = [
  {
    path: '',
    component: MainComponent
  },
  {
    path: 'auth',
    component: AuthorizationComponent
  },
  {
    path: 'registration',
    component: RegistrationComponent
  },
  {
    path: 'profile',
    component: ProfileComponent,
    children: [
      { path: '', redirectTo: 'saved-media', pathMatch: 'full' },
      { path: 'saved-media', component: SavedMediaComponent },
      { path: 'trusted-people', component: TrustedPeopleComponent },
      { path: 'notification-settings', component: NotificationSettingsComponent },
    ]
  },
  {
    path: 'profile/settings',
    component: RegistrationComponent
  },
];
