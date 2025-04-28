import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-mfa-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './mfa-setup.component.html',
  styleUrls: ['./mfa-setup.component.scss']
})
export class MfaSetupComponent implements OnInit {
  currentUser: User | null = null;
  setupForm: FormGroup;
  qrCodeUrl = '/assets/images/sample-qr-code.png'; // URL fictive pour la démo
  setupSecret = 'ABCDEF123456GHIJKL';
  isSubmitting = false;
  errorMessage = '';
  setupComplete = false;
  backupCodes: string[] = [];
  activeTab = 'app'; // 'app' ou 'sms'

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.setupForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      phoneNumber: ['']
    });
  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est connecté
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;

      if (!user) {
        this.router.navigate(['/login']);
      } else if (user.mfaEnabled) {
        // Si MFA est déjà activé, rediriger vers la page de sécurité
        this.router.navigate(['/account-security']);
      }
    });

    // Si l'utilisateur change d'onglet, mettre à jour les validateurs
    this.setupForm.get('phoneNumber')?.valueChanges.subscribe(() => {
      if (this.activeTab === 'sms') {
        this.setupForm.get('phoneNumber')?.setValidators([Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]);
      } else {
        this.setupForm.get('phoneNumber')?.clearValidators();
      }
      this.setupForm.get('phoneNumber')?.updateValueAndValidity();
    });
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.setupForm.get('verificationCode')?.setValue('');
    this.errorMessage = '';

    if (tab === 'sms') {
      this.setupForm.get('phoneNumber')?.setValidators([Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]);
    } else {
      this.setupForm.get('phoneNumber')?.clearValidators();
    }
    this.setupForm.get('phoneNumber')?.updateValueAndValidity();
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Afficher un message de confirmation temporaire
      const copyButton = document.querySelector('.copy-btn');
      if (copyButton) {
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copié !';
        setTimeout(() => {
          if (copyButton) copyButton.textContent = originalText;
        }, 2000);
      }
    });
  }

  requestSmsCode(): void {
    if (this.setupForm.get('phoneNumber')?.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Simuler l'envoi d'un SMS
    setTimeout(() => {
      this.isSubmitting = false;
      // Afficher un message de confirmation
      const messageElement = document.getElementById('sms-confirmation');
      if (messageElement) {
        messageElement.classList.add('show');
        setTimeout(() => {
          messageElement.classList.remove('show');
        }, 3000);
      }
    }, 1500);
  }

  onSubmit(): void {
    if (this.setupForm.get('verificationCode')?.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Pour la démo, accepter n'importe quel code de 6 chiffres
    if (!/^\d{6}$/.test(this.setupForm.get('verificationCode')?.value)) {
      this.isSubmitting = false;
      this.errorMessage = 'Le code de vérification doit contenir 6 chiffres.';
      return;
    }

    // Activer MFA
    if (this.currentUser) {
      this.authService.toggleMfa(true, this.currentUser).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.setupComplete = true;

          // Générer des codes de secours fictifs pour la démo
          this.backupCodes = this.generateFakeBackupCodes();
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message || 'Une erreur est survenue lors de l\'activation de l\'authentification à deux facteurs.';
        }
      });
    }
  }

  generateFakeBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const part1 = Math.floor(1000 + Math.random() * 9000).toString();
      const part2 = Math.floor(1000 + Math.random() * 9000).toString();
      codes.push(`${part1}-${part2}`);
    }
    return codes;
  }

  copyBackupCodes(): void {
    const codesText = this.backupCodes.join('\n');
    navigator.clipboard.writeText(codesText).then(() => {
      const copyButton = document.querySelector('.copy-backup-btn');
      if (copyButton) {
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Codes copiés !';
        setTimeout(() => {
          if (copyButton) copyButton.textContent = originalText;
        }, 2000);
      }
    });
  }

  printBackupCodes(): void {
    const printWindow = window.open('', '', 'width=600,height=600');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Codes de secours MFA</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .backup-codes { display: flex; flex-wrap: wrap; justify-content: center; }
            .code {
              font-family: monospace;
              font-size: 16px;
              padding: 10px;
              margin: 5px;
              border: 1px solid #ccc;
              border-radius: 5px;
              width: 100px;
              text-align: center;
            }
            p { text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <h1>Codes de secours pour l'authentification à deux facteurs</h1>
          <div class="backup-codes">
            ${this.backupCodes.map(code => `<div class="code">${code}</div>`).join('')}
          </div>
          <p>Ces codes sont à usage unique. Conservez-les en lieu sûr.</p>
          <p>Imprimé le ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  continueToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
