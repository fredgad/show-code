// import { ApplicationConfig } from '@angular/core';
// import { provideRouter } from '@angular/router';
// import { appRoutes } from './app.routes';
// import { provideClientHydration } from '@angular/platform-browser';

// export const appConfig: ApplicationConfig = {
//   providers: [provideClientHydration(), provideRouter(appRoutes)],
// };

import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { appRoutes } from './app.routes';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { reducer } from '../store/app-store.reducer';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { TimeoutInterceptor, TokenInterceptor } from '../shared/interceptors';
import { EffectsModule } from '@ngrx/effects';
import { AppStoreEffects } from '../store/app-store.effects';

const registerServiceWorker = () => () => {
  if (typeof window !== 'undefined') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/custom-sw.js')
        .then(registration => {
          console.log('Service Worker зарегистрирован:', registration);
        })
        .catch(error => {
          console.error('Ошибка при регистрации Service Worker:', error);
        });
    } else {
      console.warn('Service Worker не поддерживается в этом браузере.');
    }
  }
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),

    provideRouter(appRoutes, withEnabledBlockingInitialNavigation()),

    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TimeoutInterceptor,
      multi: true
    },

    importProvidersFrom(StoreModule.forRoot({ App: reducer }), EffectsModule.forRoot([AppStoreEffects]), StoreDevtoolsModule.instrument(), [
      BrowserModule,
      HttpClientModule,
      BrowserAnimationsModule
    ]),

    {
      provide: APP_INITIALIZER,
      useFactory: registerServiceWorker,
      multi: true
    }
  ]
};
