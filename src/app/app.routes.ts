import { Route } from '@angular/router';
import { MainComponent, AuthorizationComponent, RegistrationComponent, ProfileComponent, VideoPageComponent } from '@pages';
import { SavedMediaComponent } from '@widgets/saved-media';
import { NotificationSettingsComponent } from '@widgets/notification-settings';
import { TrustedPeopleComponent } from '@widgets/trusted-people';
import { VideoBlockComponent } from '@widgets/video-block';
import { AudioBlockComponent } from '@widgets/audio-block';

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
    ]
  },
  {
    path: 'profile/settings',
    component: RegistrationComponent
  },
  {
    path: 'capture',
    component: VideoPageComponent
  },
];
