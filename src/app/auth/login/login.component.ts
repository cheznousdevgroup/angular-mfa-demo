// auth/login/login.component.ts
import { Component, OnInit, ViewChildren, QueryList, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoginRequest } from '../models/user.model';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription, interval } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
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
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  mfaRequired = false;
  useBackupCode = false;
  loginStep = 1; // 1 = email/password, 2 = MFA

  // Animation properties
  formAnimation = 'fade-in';

  // Propriétés pour le renvoi de code
  canRequestNewCode = true;
  secondsLeft = 0;
  countdownSubscription: Subscription | null = null;
  isResendingCode = false;
  resendSuccessMessage = '';

  // Timers pour la disparition des messages
  errorMessageTimer: any = null;
  successMessageTimer: any = null;
  messageDuration = 5000; // 5 secondes avant la disparition des messages

  // Référence aux champs de saisie du code
  @ViewChildren('codeInput1, codeInput2, codeInput3, codeInput4, codeInput5, codeInput6')
  codeInputs!: QueryList<ElementRef>;

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

  ngAfterViewInit(): void {
    // Mise en focus automatique sur le premier champ de code quand on passe à l'étape MFA
    setTimeout(() => {
      if (this.loginStep === 2 && this.codeInputs?.first) {
        this.codeInputs.first.nativeElement.focus();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    // Nettoyer les abonnements pour éviter les fuites de mémoire
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }

    // Nettoyer les timers
    this.clearMessageTimers();
  }

  // Gestion de la saisie des chiffres du code
  onDigitInput(event: any, currentIndex: number, nextIndex: number): void {
    const value = event.target.value;

    // Ne garder que les chiffres
    event.target.value = value.replace(/[^0-9]/g, '');

    // Ajout de la classe filled
    if (event.target.value !== '') {
      event.target.classList.add('filled');
    } else {
      event.target.classList.remove('filled');
    }

    // Si le champ est rempli et qu'il y a un champ suivant, déplacer le focus
    if (value && nextIndex >= 0 && nextIndex < 6) {
      const inputs = this.codeInputs.toArray();
      if (inputs[nextIndex]) {
        inputs[nextIndex].nativeElement.focus();
      }
    }

    // Mise à jour du champ caché dans le formulaire
    this.updateMfaCodeValue();
  }

  // Gestion des touches clavier (notamment retour arrière)
  onDigitKeyDown(event: KeyboardEvent, currentIndex: number, previousIndex: number): void {
    // Si on appuie sur Backspace avec un champ vide et qu'il y a un champ précédent
    if (event.key === 'Backspace' &&
        (event.target as HTMLInputElement).value === '' &&
        previousIndex >= 0) {
      const inputs = this.codeInputs.toArray();
      if (inputs[previousIndex]) {
        inputs[previousIndex].nativeElement.focus();
        event.preventDefault();
      }
    }
  }

  // Gestion du copier-coller
  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text').trim().substring(0, 6);

    if (pasteData && /^\d+$/.test(pasteData)) {
      const inputs = this.codeInputs.toArray();

      for (let i = 0; i < Math.min(pasteData.length, inputs.length); i++) {
        inputs[i].nativeElement.value = pasteData[i];
        inputs[i].nativeElement.classList.add('filled');
      }

      // Focus sur le dernier champ rempli ou le suivant
      if (pasteData.length < inputs.length) {
        inputs[pasteData.length].nativeElement.focus();
      } else {
        inputs[inputs.length - 1].nativeElement.focus();
      }

      // Mise à jour du champ caché dans le formulaire
      this.updateMfaCodeValue();
    }
  }

  // Mise à jour du champ mfaCode avec les valeurs des 6 inputs
  updateMfaCodeValue(): void {
    setTimeout(() => {
      const codeInputs = document.querySelectorAll('.digit-input');
      const codeValue = Array.from(codeInputs)
        .map((input: any) => input.value)
        .join('');

      this.loginForm.get('mfaCode')?.setValue(codeValue);
      this.loginForm.get('mfaCode')?.updateValueAndValidity();
    }, 0);
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      return;
    }

    this.clearMessageTimers();
    this.isSubmitting = true;
    this.errorMessage = '';
    this.resendSuccessMessage = '';

    if (this.loginStep === 1) {
      // Première étape: vérification email/mot de passe
      const loginRequest: LoginRequest = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value
      };

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
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

            // Mise en focus sur le premier champ de code
            setTimeout(() => {
              if (this.codeInputs?.first) {
                this.codeInputs.first.nativeElement.focus();
              }
            }, 100);
          } else {
            // Rediriger vers le tableau de bord
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          this.showErrorMessage(error.message || 'Une erreur est survenue lors de la connexion');

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
          this.showErrorMessage(error.message || 'Code de vérification invalide');

          // Animation pour l'erreur
          this.shakeForm();

          if (!this.useBackupCode) {
            // Réinitialiser tous les champs de code
            const inputs = this.codeInputs.toArray();
            inputs.forEach(input => {
              input.nativeElement.value = '';
              input.nativeElement.classList.remove('filled');
            });

            // Focus sur le premier champ
            if (inputs[0]) {
              inputs[0].nativeElement.focus();
            }

            // Animation de secousse
            const container = document.querySelector('.verification-code-container');
            if (container) {
              container.classList.add('shake');
              setTimeout(() => {
                container.classList.remove('shake');
              }, 500);
            }

            // Réinitialiser le champ mfaCode dans le formulaire
            this.loginForm.get('mfaCode')?.setValue('');
          }
        }
      });
    }
  }

  toggleBackupCode(): void {
    this.useBackupCode = !this.useBackupCode;
    this.clearMessageTimers();
    this.resendSuccessMessage = '';
    this.errorMessage = '';

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

    // Réinitialiser les champs de code si on bascule vers la vérification par code
    if (!this.useBackupCode) {
      setTimeout(() => {
        const inputs = this.codeInputs?.toArray() || [];
        inputs.forEach(input => {
          input.nativeElement.value = '';
          input.nativeElement.classList.remove('filled');
        });

        // Focus sur le premier champ
        if (inputs[0]) {
          inputs[0].nativeElement.focus();
        }
      }, 0);
    }
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

  // Fonction pour demander un nouveau code
  requestNewCode(): void {
    if (!this.canRequestNewCode || this.isResendingCode) {
      return;
    }

    this.clearMessageTimers();
    this.isResendingCode = true;
    this.errorMessage = '';
    this.resendSuccessMessage = '';

    const email = this.loginForm.get('email')?.value;

    // Simulation de l'envoi d'un nouveau code
    setTimeout(() => {
      this.isResendingCode = false;

      // Message de succès
      this.showSuccessMessage('Un nouveau code a été envoyé avec succès !');

      // Réinitialiser les champs de code
      if (!this.useBackupCode) {
        const inputs = this.codeInputs.toArray();
        inputs.forEach(input => {
          input.nativeElement.value = '';
          input.nativeElement.classList.remove('filled');
        });

        // Focus sur le premier champ
        if (inputs[0]) {
          inputs[0].nativeElement.focus();
        }

        // Réinitialiser le champ mfaCode dans le formulaire
        this.loginForm.get('mfaCode')?.setValue('');
      }

      // Démarrer le décompte
      this.startCodeRequestCooldown();
    }, 1500);
  }

  // Démarrer le décompte pour le renvoi de code
  startCodeRequestCooldown(): void {
    this.canRequestNewCode = false;
    this.secondsLeft = 30;

    // Nettoyer l'abonnement précédent si existant
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }

    // Créer un nouvel intervalle pour le décompte
    this.countdownSubscription = interval(1000).pipe(
      take(this.secondsLeft)
    ).subscribe(() => {
      this.secondsLeft--;

      if (this.secondsLeft <= 0) {
        this.canRequestNewCode = true;
        if (this.countdownSubscription) {
          this.countdownSubscription.unsubscribe();
        }
      }
    });
  }

  // Fonction pour afficher un message d'erreur avec auto-disparition
  showErrorMessage(message: string): void {
    this.clearMessageTimers();
    this.errorMessage = message;

    // Programmer la disparition du message
    this.errorMessageTimer = setTimeout(() => {
      this.errorMessage = '';
    }, this.messageDuration);
  }

  // Fonction pour afficher un message de succès avec auto-disparition
  showSuccessMessage(message: string): void {
    this.clearMessageTimers();
    this.resendSuccessMessage = message;

    // Programmer la disparition du message
    this.successMessageTimer = setTimeout(() => {
      this.resendSuccessMessage = '';
    }, this.messageDuration);
  }

  // Nettoyer les timers des messages
  clearMessageTimers(): void {
    if (this.errorMessageTimer) {
      clearTimeout(this.errorMessageTimer);
      this.errorMessageTimer = null;
    }

    if (this.successMessageTimer) {
      clearTimeout(this.successMessageTimer);
      this.successMessageTimer = null;
    }
  }
}
