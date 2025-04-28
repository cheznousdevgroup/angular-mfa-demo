import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { User } from '../../auth/models/user.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true, // Assurez-vous que le composant est bien en mode standalone
  imports: [
    CommonModule, // Ajoutez CommonModule ici
    RouterModule // Autres modules que vous pourriez utiliser
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  activityLog: any[] = [];
  showWelcomeAnimation = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est connecté
    this.authService.currentUser.subscribe(user => {
      console.log('Dashboard received user:', user);
      this.currentUser = user;
      this.isLoading = false;

      if (!user) {
        this.router.navigate(['/login']);
      } else {
        // Charger l'historique d'activité
        this.loadActivityLog();
      }
    });

    // Désactiver l'animation de bienvenue après 2 secondes
    setTimeout(() => {
      this.showWelcomeAnimation = false;
    }, 2000);
  }

  loadActivityLog(): void {
    if (this.currentUser) {
      this.authService.getActivityLog(this.currentUser.id).subscribe(log => {
        this.activityLog = log;
      });
    }
  }

  logout(): void {
    // Afficher une animation de déconnexion
    const dashboardElement = document.querySelector('.dashboard-container');
    if (dashboardElement) {
      dashboardElement.classList.add('fade-out');

      setTimeout(() => {
        this.authService.logout();
      }, 500);
    } else {
      this.authService.logout();
    }
  }

  goToAccountSecurity(): void {
    this.router.navigate(['/account-security']);
  }
}
