import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MfaService } from '../../services/mfa.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mfa-setup',
  standalone: true, // Ensure standalone is true
  imports: [ReactiveFormsModule],
  templateUrl: './mfa-setup.component.html',
  styleUrls: ['./mfa-setup.component.scss'],
})
export class MfaSetupComponent implements OnInit {
  setupForm: FormGroup;
  qrCodeUrl: SafeUrl | null = null;
  setupSecret: string = '';
  isSubmitting = false;
  errorMessage: string = '';
  setupComplete = false;

  constructor(
    private fb: FormBuilder,
    private mfaService: MfaService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {
    this.setupForm = this.fb.group({
      verificationCode: [
        '',
        [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
      ],
    });
  }

  ngOnInit(): void {
    this.generateMfaSetup();
  }

  generateMfaSetup(): void {
    // const userId = this.authService.getCurrentUser()?.id;
    // if (userId) {
    //   this.mfaService.setupMfa(userId).subscribe({
    //     next: (response) => {
    //       if (response.qrCodeUrl) {
    //         this.qrCodeUrl = this.sanitizer.bypassSecurityTrustUrl(
    //           response.qrCodeUrl
    //         );
    //       }
    //       this.setupSecret = response.secret || '';
    //     },
    //     error: (error) => {
    //       this.errorMessage =
    //         error?.error?.message || 'Failed to setup MFA. Please try again.';
    //     },
    //   });
    // }
  }

  onSubmit(): void {
    if (this.setupForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const verificationCode = this.setupForm.get('verificationCode')?.value;
    // const userId = this.authService.getCurrentUser()?.id;

    // if (userId) {
    //   this.mfaService.enableMfa(userId, verificationCode).subscribe({
    //     next: () => {
    //       this.setupComplete = true;
    //       // Update user profile or auth state
    //       // this.authService.refreshUserProfile();
    //     },
    //     error: (error) => {
    //       this.isSubmitting = false;
    //       this.errorMessage =
    //         error?.error?.message ||
    //         'Failed to verify MFA code. Please check the code and try again.';
    //     },
    //   });
    // }
  }
}
