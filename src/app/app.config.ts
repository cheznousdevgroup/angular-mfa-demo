import { provideHttpClient } from '@angular/common/http'; // Add this import
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { MfaService } from './auth/services/mfa.service';
import { AuthService } from './auth/services/auth.service';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(), // Provide HttpClient
    provideAnimations() ,
    AuthService,
    MfaService,
  ],
};
