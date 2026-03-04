import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="reset-password">
      <div class="container">
        <div class="form-box">
          <h1>Réinitialiser le mot de passe</h1>
          @if (success) {
            <p class="message success">Votre mot de passe a été mis à jour.</p>
            <a routerLink="/compte/connexion" class="btn btn-primary">Se connecter</a>
          } @else if (token) {
            <form (ngSubmit)="submit()">
              <div class="form-group">
                <label>Nouveau mot de passe</label>
                <input type="password" [(ngModel)]="password" name="password" required minlength="6" />
              </div>
              <div class="form-group">
                <label>Confirmer le mot de passe</label>
                <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required />
              </div>
              @if (message) {
                <p class="message error">{{ message }}</p>
              }
              <button type="submit" class="btn btn-primary" [disabled]="loading">
                {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </form>
          } @else {
            <p class="message error">Lien invalide ou expiré.</p>
            <a routerLink="/compte/mot-de-passe-oublie" class="btn btn-primary">Demander un nouveau lien</a>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reset-password { padding: 60px 0; }
    .form-box {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      padding: 32px;
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .form-group { margin-bottom: 24px; }
    .form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }
    .btn { width: 100%; margin-bottom: 16px; }
    .message { margin-bottom: 16px; padding: 12px; border-radius: 6px; }
    .message.success { background: #e8f5e9; color: #2e7d32; }
    .message.error { background: #ffebee; color: #c62828; }
    a { display: block; text-align: center; color: var(--primary-color); margin-top: 8px; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  loading = false;
  success = false;
  message = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
  }

  submit() {
    this.message = '';
    if (this.password !== this.confirmPassword) {
      this.message = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.password.length < 6) {
      this.message = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }
    this.loading = true;
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.success = true;
      },
      error: (err) => {
        this.message = err.error?.message || 'Lien invalide ou expiré.';
        this.loading = false;
      }
    });
  }
}
