import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { MfaVerificationComponent } from './auth/mfa/mfa-verification/mfa-verification.component';
import { MfaSetupComponent } from './auth/mfa/mfa-setup/mfa-setup.component';
import { AccountSecurityComponent } from './auth/account-security/account-security.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

// Assurez-vous d'utiliser "export const routes" au lieu de "const routes"
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'mfa-verification', component: MfaVerificationComponent },
  { path: 'mfa-setup', component: MfaSetupComponent },
  { path: 'account-security', component: AccountSecurityComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '**', redirectTo: '/login' }
];
