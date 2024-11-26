import { Route } from '@angular/router';
import { MainComponent, SettingsComponent, TrustedProfileComponent } from '@pages';
import { SavedMediaComponent } from '@widgets/saved-media';
import { NotificationSettingsComponent } from '@widgets/notification-settings';
import { TrustedPeopleComponent } from '@widgets/trusted-people';
import { VideoBlockComponent } from '@widgets/video-block';
import { AudioBlockComponent } from '@widgets/audio-block';
import { AuthGuard } from '@shared/guards';
import { IncomingComponent, OutgoingComponent, RequestsComponent } from '@widgets/requests';

export const appRoutes: Route[] = [
  {
    path: '',
    component: MainComponent
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
    path: 'profile',
    loadComponent: () => import('@pages').then(x => x.ProfileComponent),
    children: [
      { path: '', redirectTo: 'saved-media', pathMatch: 'full' },
      {
        path: 'saved-media',
        component: SavedMediaComponent
        // children: [
        //   { path: '', redirectTo: 'video', pathMatch: 'full' },
        //   { path: 'video', component: VideoBlockComponent },
        //   { path: 'audio', component: AudioBlockComponent }
        // ]
      },
      { path: 'trusted-people', component: TrustedPeopleComponent },
      { path: 'notification-settings', component: NotificationSettingsComponent },
      {
        path: 'requests',
        component: RequestsComponent,
        children: [
          { path: '', redirectTo: 'incoming', pathMatch: 'full' },
          { path: 'incoming', component: IncomingComponent },
          { path: 'outgoing', component: OutgoingComponent }
        ]
      }
    ],
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'trusted-profile/:keyId',
    component: TrustedProfileComponent,
    // children: [
    //   { path: '', redirectTo: 'video', pathMatch: 'full' },
    //   { path: 'video', component: VideoBlockComponent },
    //   { path: 'audio', component: AudioBlockComponent }
    // ],
    canActivate: [AuthGuard]
  },
  {
    path: 'capture',
    loadComponent: () => import('@pages').then(x => x.VideoPageComponent),
    canActivate: [AuthGuard]
  }
];
