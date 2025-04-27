import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { MfaService } from '../services/mfa.service';

@Injectable({
  providedIn: 'root',
})
export class MfaGuard implements CanActivate {
  constructor(
    private router: Router,
    private mfaService: MfaService,
    private authService: AuthService
  ) {}

  canActivate(): Observable<boolean> {
    return this.mfaService.mfaVerified.pipe(
      take(1),
      map((verified) => {
        // Check if user is authenticated first
        const isAuthenticated = this.authService.isAuthenticated();

        if (!isAuthenticated) {
          this.router.navigate(['/login']);
          return false;
        }

        // Check if user has MFA enabled and if it's been verified
        const user = this.authService.getCurrentUser();
        const mfaEnabled = user?.mfaEnabled || false;

        if (mfaEnabled && !verified) {
          // Redirect to MFA verification page
          this.mfaService.setMfaRequired(true);
          this.router.navigate(['/auth/mfa-verify']);
          return false;
        }

        return true;
      })
    );
  }
}
