import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from 'express';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})
export class LogoutComponent  implements OnInit{
constructor(
    private authService: AuthService,
    private router: Router
  ) {

  }

  ngOnInit(): void {
    // Vérifier si l'utilisateur est déjà connecté
    this.authService.logout();
  }
}
