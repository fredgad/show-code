import { Route } from '@angular/router';
import { MainComponent, AuthorizationComponent, RegistrationComponent, ProfileComponent } from '@pages';

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
    component: ProfileComponent
  },
];
