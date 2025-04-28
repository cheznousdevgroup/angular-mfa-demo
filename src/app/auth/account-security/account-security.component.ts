import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BackupCode, User } from '../models/user.model';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-account-security',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './account-security.component.html',
  styleUrls: ['./account-security.component.scss'],
})
export class AccountSecurityComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  disableMfaForm: FormGroup;
  backupCodes: BackupCode[] = [];
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  showDisableMfaModal = false;
  showBackupCodesModal = false;
  remainingBackupCodes: number = 0;
  totalBackupCodes: number = 0;
  activities: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.disableMfaForm = this.fb.group({
      password: ['', Validators.required],
      verificationCode: [
        '',
        [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
      ],
    });
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est connecté
    this.authService.currentUser.subscribe((user) => {
      this.currentUser = user;
      this.isLoading = false;

      if (!user) {
        this.router.navigate(['/login']);
      } else {
        // Calculer les nombres de codes
    this.totalBackupCodes = user.backupCodes?.length || 0;
    this.remainingBackupCodes = user.backupCodes?.filter(code => !code.used).length || 0;
        // Charger l'historique d'activité si nécessaire
        this.loadActivityLog();
      }
    });
  }

  loadActivityLog(): void {
    if (this.currentUser) {
      this.authService.getActivityLog(this.currentUser.id).subscribe(activities => {
        this.activities = activities;
      });
    }
  }

  onEnableMfa(): void {
    this.router.navigate(['/mfa-setup']);
  }

  openDisableMfaModal(): void {
    this.showDisableMfaModal = true;
    this.disableMfaForm.reset();
    this.errorMessage = '';
  }

  closeDisableMfaModal(): void {
    this.showDisableMfaModal = false;
  }

  onDisableMfa(): void {
    if (this.disableMfaForm.invalid || this.isSubmitting || !this.currentUser) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Pour la démo, accepter n'importe quel code tant que le format est correct
    this.authService
      .toggleMfa(
        false,
        this.currentUser,
        this.disableMfaForm.get('verificationCode')?.value
      )
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.closeDisableMfaModal();
          this.successMessage =
            "L'authentification à deux facteurs a été désactivée avec succès.";

          // Fermer la notification de succès après 3 secondes
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage =
            error.message ||
            "Une erreur est survenue lors de la désactivation de l'authentification à deux facteurs.";
        },
      });
  }

  openBackupCodesModal(): void {
    this.showBackupCodesModal = true;
    this.backupCodes = this.currentUser?.backupCodes || [];
  }

  closeBackupCodesModal(): void {
    this.showBackupCodesModal = false;
  }

  regenerateBackupCodes(): void {
    if (!this.currentUser || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.regenerateBackupCodes(this.currentUser.id).subscribe({
      next: (codes) => {
        this.isSubmitting = false;
        this.backupCodes = codes;
        this.successMessage =
          'Les codes de secours ont été régénérés avec succès.';

        // Fermer la notification de succès après 3 secondes
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.message ||
          'Une erreur est survenue lors de la régénération des codes de secours.';
      },
    });
  }

  copyBackupCodes(): void {
    if (!this.backupCodes.length) return;

    const codeText = this.backupCodes.map((code) => code.code).join('\n');

    navigator.clipboard
      .writeText(codeText)
      .then(() => {
        this.successMessage =
          'Les codes ont été copiés dans le presse-papiers.';

        // Fermer la notification de succès après 3 secondes
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      })
      .catch(() => {
        this.errorMessage =
          'Impossible de copier les codes. Veuillez les copier manuellement.';
      });
  }

  printBackupCodes(): void {
    const printContent = document.getElementById('printable-backup-codes');
    if (!printContent) return;

    const windowPrint = window.open('', '', 'width=900,height=600');
    if (!windowPrint) return;

    windowPrint.document.write(`
      <html>
        <head>
          <title>Codes de secours</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 30px; }
            .codes-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .code-item { padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; font-size: 16px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>Codes de secours pour l'authentification à deux facteurs</h1>
          <p>Conservez ces codes dans un endroit sûr. Chaque code ne peut être utilisé qu'une seule fois.</p>
          <div class="codes-container">
            ${this.backupCodes
              .map((code) => `<div class="code-item">${code.code}</div>`)
              .join('')}
          </div>
          <div class="footer">
            <p>Imprimé le ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);

    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
    windowPrint.close();
  }
}
