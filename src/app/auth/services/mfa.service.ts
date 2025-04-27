import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface MfaSetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes?: string[];
}

export interface MfaVerifyResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MfaService {
  private apiUrl = 'https://your-api-url/api/mfa';

  private mfaRequiredSubject = new BehaviorSubject<boolean>(false);
  public mfaRequired = this.mfaRequiredSubject.asObservable();

  private mfaVerifiedSubject = new BehaviorSubject<boolean>(false);
  public mfaVerified = this.mfaVerifiedSubject.asObservable();

  private backupCodesSubject = new BehaviorSubject<string[]>([]);
  public backupCodes = this.backupCodesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Set MFA as required (for routing guard)
  setMfaRequired(required: boolean): void {
    this.mfaRequiredSubject.next(required);
  }

  // Set MFA as verified (for routing guard)
  setMfaVerified(verified: boolean): void {
    this.mfaVerifiedSubject.next(verified);
  }

  // Generate MFA setup (QR code, secret)
  setupMfa(type: string, phoneNumber?: string): Observable<MfaSetupResponse> {
    const setupData: any = { type };

    if (type === 'sms' && phoneNumber) {
      setupData.phoneNumber = phoneNumber;
    }

    return this.http.post<MfaSetupResponse>(`${this.apiUrl}/setup`, setupData).pipe(
      tap(response => {
        if (response.backupCodes) {
          this.backupCodesSubject.next(response.backupCodes);
        }
      })
    );
  }

  // Enable MFA for user account
  enableMfa(verificationCode: string, type: 'totp' | 'sms' = 'totp', phoneNumber?: string): Observable<MfaVerifyResponse> {
    const enableData: any = {
      verificationCode,
      type
    };

    if (type === 'sms' && phoneNumber) {
      enableData.phoneNumber = phoneNumber;
    }

    return this.http.post<MfaVerifyResponse>(`${this.apiUrl}/enable`, enableData);
  }

  // Disable MFA for user account
  disableMfa(verificationCode: string, password: string): Observable<MfaVerifyResponse> {
    return this.http.post<MfaVerifyResponse>(`${this.apiUrl}/disable`, {
      verificationCode,
      password
    });
  }

  // Verify MFA code (used in auth interceptor for protected endpoints)
  verifyMfa(verificationCode: string): Observable<MfaVerifyResponse> {
    return this.http.post<MfaVerifyResponse>(`${this.apiUrl}/verify`, {
      verificationCode
    }).pipe(
      tap(() => {
        this.setMfaVerified(true);
      })
    );
  }

  // Request new SMS code
  requestSmsCode(phoneNumber: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/sms/request`, {
      phoneNumber
    });
  }

  // Generate new backup codes
  generateBackupCodes(verificationCode: string): Observable<{backupCodes: string[]}> {
    return this.http.post<{backupCodes: string[]}>(`${this.apiUrl}/backup-codes/generate`, {
      verificationCode
    }).pipe(
      tap(response => {
        this.backupCodesSubject.next(response.backupCodes);
      })
    );
  }

  // Get backup codes
  getBackupCodes(verificationCode: string): Observable<{backupCodes: {code: string, used: boolean}[]}> {
    return this.http.post<{backupCodes: {code: string, used: boolean}[]}>(`${this.apiUrl}/backup-codes/view`, {
      verificationCode
    });
  }
}
