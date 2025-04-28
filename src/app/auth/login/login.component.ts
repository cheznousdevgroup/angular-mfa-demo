import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../models/user.model';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule], // Include necessary modules
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  mfaRequired = false;
  useBackupCode = false;
  loginStep = 1; // 1 = email/password, 2 = MFA

  // Animation properties
  formAnimation = 'fade-in';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['user@example.com', [Validators.required, Validators.email]], // Prérempli pour la démo
      password: ['password123', Validators.required], // Prérempli pour la démo
      mfaCode: ['', [Validators.minLength(6), Validators.maxLength(6)]],
      backupCode: [''],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà connecté
    this.authService.isAuthenticated.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    if (this.loginStep === 1) {
      // Première étape: vérification email/mot de passe
      const loginRequest: LoginRequest = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          console.log('Login response:', response);
          this.isSubmitting = false;

          if (response.mfaRequired) {
            // Passer à l'étape MFA
            this.mfaRequired = true;
            this.loginStep = 2;

            // Ajouter une animation pour la transition
            this.formAnimation = 'slide-in';

            // Ajouter la validation pour le code MFA
            this.loginForm.get('mfaCode')?.setValidators([
              Validators.required,
              Validators.minLength(6),
              Validators.maxLength(6)
            ]);
            this.loginForm.get('mfaCode')?.updateValueAndValidity();
          } else {
            // Rediriger vers le tableau de bord
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message || 'Une erreur est survenue lors de la connexion';

          // Animation pour l'erreur
          this.shakeForm();
        }
      });
    } else if (this.loginStep === 2) {
      // Deuxième étape: vérification MFA
      const loginRequest: LoginRequest = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };

      if (this.useBackupCode) {
        loginRequest.backupCode = this.loginForm.get('backupCode')?.value;
      } else {
        loginRequest.mfaCode = this.loginForm.get('mfaCode')?.value;
      }

      this.authService.login(loginRequest).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message || 'Code de vérification invalide';

          // Animation pour l'erreur
          this.shakeForm();
        }
      });
    }
  }

  toggleBackupCode(): void {
    this.useBackupCode = !this.useBackupCode;

    if (this.useBackupCode) {
      this.loginForm.get('mfaCode')?.clearValidators();
      this.loginForm.get('mfaCode')?.updateValueAndValidity();

      this.loginForm.get('backupCode')?.setValidators([Validators.required]);
      this.loginForm.get('backupCode')?.updateValueAndValidity();
    } else {
      this.loginForm.get('backupCode')?.clearValidators();
      this.loginForm.get('backupCode')?.updateValueAndValidity();

      this.loginForm.get('mfaCode')?.setValidators([
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6)
      ]);
      this.loginForm.get('mfaCode')?.updateValueAndValidity();
    }

    // Réinitialiser les valeurs
    this.loginForm.get('mfaCode')?.setValue('');
    this.loginForm.get('backupCode')?.setValue('');
    this.errorMessage = '';
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
