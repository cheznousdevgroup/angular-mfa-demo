import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-mfa-verification',
  standalone: true,
    imports: [ReactiveFormsModule],
  templateUrl: './mfa-verification.component.html',
  styleUrls: ['./mfa-verification.component.scss']
})
export class MfaVerificationComponent implements OnInit {
  verificationForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  useBackupCode = false;
  secondsLeft = 30; // Pour simuler un décompte avant de pouvoir demander un nouveau code
  canRequestNewCode = false;
  countdownInterval: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.verificationForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      backupCode: ['']
    });
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est connecté
    this.authService.isAuthenticated.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigate(['/dashboard']);
      }
    });

    // Démarrer le compte à rebours pour la demande d'un nouveau code
    this.startCountdown();
  }

  ngOnDestroy(): void {
    // Nettoyer l'intervalle au démontage du composant
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.secondsLeft = 30;
    this.canRequestNewCode = false;

    this.countdownInterval = setInterval(() => {
      this.secondsLeft--;
      if (this.secondsLeft <= 0) {
        clearInterval(this.countdownInterval);
        this.canRequestNewCode = true;
      }
    }, 1000);
  }

  onSubmit(): void {
    if (this.verificationForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const code = this.useBackupCode
      ? this.verificationForm.get('backupCode')?.value
      : this.verificationForm.get('verificationCode')?.value;

    this.authService.verifyMfa(code, this.useBackupCode).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.message || 'Code de vérification invalide';

        // Animation pour secouer le formulaire
        this.shakeForm();
      }
    });
  }

  toggleBackupCode(): void {
    this.useBackupCode = !this.useBackupCode;

    if (this.useBackupCode) {
      this.verificationForm.get('verificationCode')?.clearValidators();
      this.verificationForm.get('verificationCode')?.updateValueAndValidity();

      this.verificationForm.get('backupCode')?.setValidators([Validators.required]);
      this.verificationForm.get('backupCode')?.updateValueAndValidity();
    } else {
      this.verificationForm.get('backupCode')?.clearValidators();
      this.verificationForm.get('backupCode')?.updateValueAndValidity();

      this.verificationForm.get('verificationCode')?.setValidators([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6)
      ]);
      this.verificationForm.get('verificationCode')?.updateValueAndValidity();
    }

    // Réinitialiser les valeurs
    this.verificationForm.get('verificationCode')?.setValue('');
    this.verificationForm.get('backupCode')?.setValue('');
    this.errorMessage = '';
  }

  requestNewCode(): void {
    if (!this.canRequestNewCode) return;

    // Simuler l'envoi d'un nouveau code
    this.isSubmitting = true;

    setTimeout(() => {
      this.isSubmitting = false;
      // Message de succès
      this.errorMessage = '';
      // Afficher une notification de succès
      const successElement = document.getElementById('successNotification');
      if (successElement) {
        successElement.classList.add('show');
        setTimeout(() => {
          successElement.classList.remove('show');
        }, 3000);
      }

      // Redémarrer le compte à rebours
      this.startCountdown();
    }, 1500);
  }

  // Animation pour secouer le formulaire en cas d'erreur
  shakeForm(): void {
    const formElement = document.querySelector('.auth-card');
    if (formElement) {
      formElement.classList.add('shake');
      setTimeout(() => {
        formElement.classList.remove('shake');
      }, 500);
    }
  }
}
