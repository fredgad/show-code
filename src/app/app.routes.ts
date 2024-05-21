import { Route } from '@angular/router';
import { MainComponent, SettingsComponent, TrustedProfileComponent } from '@pages';
import { SavedMediaComponent } from '@widgets/saved-media';
import { NotificationSettingsComponent } from '@widgets/notification-settings';
import { TrustedPeopleComponent } from '@widgets/trusted-people';
import { VideoBlockComponent } from '@widgets/video-block';
import { AudioBlockComponent } from '@widgets/audio-block';
import { AuthGuard } from '@shared/guards';

export const appRoutes: Route[] = [
  {
    path: '',
    component: MainComponent
  },
  {
    path: 'auth',
    loadComponent: () => import('@pages').then((x) => x.AuthorizationComponent),
  },
  {
    path: 'registration',
    loadComponent: () => import('@pages').then((x) => x.RegistrationComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('@pages').then((x) => x.ProfileComponent),
    children: [
      { path: '', redirectTo: 'saved-media', pathMatch: 'full' },
      { 
        path: 'saved-media',
        component: SavedMediaComponent,
        children: [
          { path: '', redirectTo: 'video', pathMatch: 'full' },
          { path: 'video', component: VideoBlockComponent },
          { path: 'audio', component: AudioBlockComponent }
        ]
      },
      { path: 'trusted-people', component: TrustedPeopleComponent },
      { path: 'notification-settings', component: NotificationSettingsComponent },
    ],
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent
  },
  {
    path: 'trusted-profile',
    component: TrustedProfileComponent,
    children: [
      { path: '', redirectTo: 'video', pathMatch: 'full' },
      { path: 'video', component: VideoBlockComponent },
      { path: 'audio', component: AudioBlockComponent }
    ]
  },
  {
    path: 'capture',
    loadComponent: () => import('@pages').then((x) => x.VideoPageComponent),
  },
];
