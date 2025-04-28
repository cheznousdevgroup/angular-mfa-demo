import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { LoginComponent } from './auth/login/login.component';
import { AccountSecurityComponent } from './auth/account-security/account-security.component';
import { MfaVerificationComponent } from './auth/mfa/mfa-verification/mfa-verification.component';
import { MfaSetupComponent } from './auth/mfa/mfa-setup/mfa-setup.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  // Routes d'authentification sans le layout principal
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'mfa-verification', component: MfaVerificationComponent },

  // Routes protégées avec le layout principal
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'mfa-setup', component: MfaSetupComponent },
      { path: 'account-security', component: AccountSecurityComponent },
      { path: 'dashboard', component: DashboardComponent },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
