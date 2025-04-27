import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, LoginRequest, LoginResponse, BackupCode } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated = this.isAuthenticatedSubject.asObservable();

  // Données utilisateur en dur pour la simulation
  private mockUsers: User[] = [
    {
      id: '1',
      email: 'user@example.com',
      password: 'password123', // NE JAMAIS faire ça dans une vraie application
      firstName: 'John',
      lastName: 'Doe',
      mfaEnabled: true,
      mfaType: 'app',
      mfaSecret: 'ABCDEF123456GHIJKL',
      backupCodes: [
        { code: '1234-5678', used: false },
        { code: '2345-6789', used: false },
        { code: '3456-7890', used: false },
        { code: '4567-8901', used: false },
        { code: '5678-9012', used: false },
        { code: '6789-0123', used: false },
        { code: '7890-1234', used: true, usedAt: new Date('2025-04-20') },
        { code: '8901-2345', used: true, usedAt: new Date('2025-04-15') }
      ],
      lastMfaVerification: new Date('2025-04-25')
    },
    {
      id: '2',
      email: 'nomfa@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
      mfaEnabled: false
    }
  ];

  // Mock activity log pour la démonstration
  private activityLog = [
    {
      userId: '1',
      timestamp: new Date('2025-04-27T10:15:00'),
      action: 'Connexion',
      ipAddress: '192.168.1.1',
      device: 'Chrome / Windows'
    },
    {
      userId: '1',
      timestamp: new Date('2025-04-26T18:30:00'),
      action: 'Changement de mot de passe',
      ipAddress: '192.168.1.1',
      device: 'Chrome / Windows'
    },
    {
      userId: '1',
      timestamp: new Date('2025-04-25T14:30:00'),
      action: 'MFA activé',
      ipAddress: '192.168.1.1',
      device: 'Chrome / Windows'
    }
  ];

  private temporaryUserId: string | null = null;

  constructor(private router: Router) {
    // Vérifier si l'utilisateur est déjà connecté (stockage local)
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  login(loginRequest: LoginRequest): Observable<LoginResponse> {
    // Trouver l'utilisateur
    const user = this.mockUsers.find(u => u.email === loginRequest.email);

    // Simulation d'une latence réseau
    return of({} as LoginResponse).pipe(
      delay(1000),
      tap(() => {
        if (!user) {
          throw new Error('Email ou mot de passe invalide');
        }

        if (user.password !== loginRequest.password) {
          throw new Error('Email ou mot de passe invalide');
        }

        // Si MFA est activé
        if (user.mfaEnabled) {
          // Si un code MFA est fourni, le vérifier
          if (loginRequest.mfaCode) {
            // Simuler la vérification du code (123456 est valide pour la démo)
            if (loginRequest.mfaCode !== '123456') {
              throw new Error('Code de vérification invalide');
            }

            // Connexion réussie avec MFA
            this.completeLogin(user);
            return {
              success: true,
              userId: user.id,
              token: 'mock-jwt-token'
            };
          } else if (loginRequest.backupCode) {
            // Vérifier le code de secours
            const backupCode = user.backupCodes?.find(code =>
              !code.used && code.code === loginRequest.backupCode
            );

            if (!backupCode) {
              throw new Error('Code de secours invalide ou déjà utilisé');
            }

            // Marquer le code comme utilisé
            backupCode.used = true;
            backupCode.usedAt = new Date();

            // Connexion réussie avec code de secours
            this.completeLogin(user);
            return {
              success: true,
              userId: user.id,
              token: 'mock-jwt-token'
            };
          }

          // MFA requis mais pas encore fourni
          this.temporaryUserId = user.id;
          return {
            success: false,
            mfaRequired: true,
            userId: user.id,
            message: 'Vérification à deux facteurs requise'
          };
        }

        // Connexion réussie sans MFA
        this.completeLogin(user);
        return {
          success: true,
          userId: user.id,
          token: 'mock-jwt-token'
        };
      })
    );
  }

  verifyMfa(code: string, isBackupCode: boolean = false): Observable<LoginResponse> {
    if (!this.temporaryUserId) {
      return of({ success: false, message: 'Session expirée' });
    }

    const user = this.mockUsers.find(u => u.id === this.temporaryUserId);
    if (!user) {
      return of({ success: false, message: 'Utilisateur non trouvé' });
    }

    // Simuler une latence réseau
    return of({} as LoginResponse).pipe(
      delay(800),
      tap(() => {
        if (isBackupCode) {
          // Vérifier le code de secours
          const backupCode = user.backupCodes?.find(backupCode =>
            !backupCode.used && backupCode.code === code
          );

          if (!backupCode) {
            throw new Error('Code de secours invalide ou déjà utilisé');
          }

          // Marquer le code comme utilisé
          backupCode.used = true;
          backupCode.usedAt = new Date();
        } else {
          // Pour la démo, 123456 est toujours un code valide
          if (code !== '123456') {
            throw new Error('Code de vérification invalide');
          }
        }

        // Mettre à jour la dernière vérification MFA
        user.lastMfaVerification = new Date();

        // Connexion réussie
        this.completeLogin(user);
        return {
          success: true,
          userId: user.id,
          token: 'mock-jwt-token'
        };
      })
    );
  }

  private completeLogin(user: User): void {
    // Enregistrer l'activité
    this.activityLog.unshift({
      userId: user.id,
      timestamp: new Date(),
      action: 'Connexion',
      ipAddress: '192.168.1.1',
      device: this.getBrowserInfo()
    });

    // Nettoyer l'ID temporaire
    this.temporaryUserId = null;

    // Stocker l'utilisateur
    const userCopy = { ...user };
    // delete userCopy.password; // Ne jamais stocker le mot de passe

    localStorage.setItem('currentUser', JSON.stringify(userCopy));
    this.currentUserSubject.next(userCopy);
    this.isAuthenticatedSubject.next(true);
  }

  logout(): void {
    // Nettoyer le stockage local
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  toggleMfa(enable: boolean, user: User, verificationCode?: string): Observable<boolean> {
    // Simuler une latence réseau
    return of(true).pipe(
      delay(1000),
      tap(() => {
        // Trouver l'utilisateur
        const userIndex = this.mockUsers.findIndex(u => u.id === user.id);
        if (userIndex === -1) {
          throw new Error('Utilisateur non trouvé');
        }

        if (enable) {
          // Activer MFA et générer des codes de secours
          this.mockUsers[userIndex].mfaEnabled = true;
          this.mockUsers[userIndex].mfaType = 'app';
          this.mockUsers[userIndex].mfaSecret = 'ABCDEF123456GHIJKL';

          if (!this.mockUsers[userIndex].backupCodes) {
            this.mockUsers[userIndex].backupCodes = this.generateBackupCodes();
          }

          // Enregistrer l'activité
          this.activityLog.unshift({
            userId: user.id,
            timestamp: new Date(),
            action: 'MFA activé',
            ipAddress: '192.168.1.1',
            device: this.getBrowserInfo()
          });
        } else {
          // Désactiver MFA
          this.mockUsers[userIndex].mfaEnabled = false;
          this.mockUsers[userIndex].mfaType = undefined;
          this.mockUsers[userIndex].mfaSecret = undefined;
          this.mockUsers[userIndex].backupCodes = undefined;

          // Enregistrer l'activité
          this.activityLog.unshift({
            userId: user.id,
            timestamp: new Date(),
            action: 'MFA désactivé',
            ipAddress: '192.168.1.1',
            device: this.getBrowserInfo()
          });
        }

        // Mettre à jour l'utilisateur en session
        const updatedUser = this.mockUsers[userIndex];
        const userCopy = { ...updatedUser };
        // delete userCopy.password;

        localStorage.setItem('currentUser', JSON.stringify(userCopy));
        this.currentUserSubject.next(userCopy);
      })
    );
  }

  generateBackupCodes(): BackupCode[] {
    const codes: BackupCode[] = [];
    for (let i = 0; i < 8; i++) {
      const part1 = Math.floor(1000 + Math.random() * 9000).toString();
      const part2 = Math.floor(1000 + Math.random() * 9000).toString();
      codes.push({
        code: `${part1}-${part2}`,
        used: false
      });
    }
    return codes;
  }

  regenerateBackupCodes(userId: string): Observable<BackupCode[]> {
    // Simuler une latence réseau
    return of([]).pipe(
      delay(800),
      tap(() => {
        // Trouver l'utilisateur
        const userIndex = this.mockUsers.findIndex(u => u.id === userId);
        if (userIndex === -1) {
          throw new Error('Utilisateur non trouvé');
        }

        // Générer de nouveaux codes
        const newCodes = this.generateBackupCodes();
        this.mockUsers[userIndex].backupCodes = newCodes;

        // Mettre à jour l'utilisateur en session
        const updatedUser = this.mockUsers[userIndex];
        const userCopy = { ...updatedUser };
        // delete userCopy.password;

        localStorage.setItem('currentUser', JSON.stringify(userCopy));
        this.currentUserSubject.next(userCopy);

        // Enregistrer l'activité
        this.activityLog.unshift({
          userId,
          timestamp: new Date(),
          action: 'Codes de secours régénérés',
          ipAddress: '192.168.1.1',
          device: this.getBrowserInfo()
        });

        return newCodes;
      })
    );
  }

  getActivityLog(userId: string): Observable<any[]> {
    // Filtrer les activités pour cet utilisateur
    const userActivities = this.activityLog.filter(activity => activity.userId === userId);

    // Simuler une latence réseau
    return of(userActivities).pipe(delay(500));
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    let browserName = "Unknown";
    let osName = "Unknown";

    // Détecter le navigateur
    if (userAgent.indexOf("Chrome") > -1) {
      browserName = "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      browserName = "Safari";
    } else if (userAgent.indexOf("Firefox") > -1) {
      browserName = "Firefox";
    } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
      browserName = "Internet Explorer";
    } else if (userAgent.indexOf("Edge") > -1) {
      browserName = "Edge";
    }

    // Détecter le système d'exploitation
    if (userAgent.indexOf("Windows") > -1) {
      osName = "Windows";
    } else if (userAgent.indexOf("Mac") > -1) {
      osName = "MacOS";
    } else if (userAgent.indexOf("Linux") > -1) {
      osName = "Linux";
    } else if (userAgent.indexOf("Android") > -1) {
      osName = "Android";
    } else if (userAgent.indexOf("iOS") > -1 ||
               userAgent.indexOf("iPhone") > -1 ||
               userAgent.indexOf("iPad") > -1) {
      osName = "iOS";
    }

    return `${browserName} / ${osName}`;
  }
}
