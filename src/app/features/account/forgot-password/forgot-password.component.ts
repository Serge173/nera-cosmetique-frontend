import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="forgot-password">
      <div class="container">
        <div class="form-box">
          <h1>Mot de passe oublié</h1>
          @if (sent) {
            <p class="message success">{{ message }}</p>
            <a routerLink="/compte/connexion" class="btn btn-primary">Retour à la connexion</a>
          } @else {
            <form (ngSubmit)="submit()">
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="email" name="email" required />
              </div>
              @if (message && !sent) {
                <p class="message error">{{ message }}</p>
              }
              <button type="submit" class="btn btn-primary" [disabled]="loading">
                {{ loading ? 'Envoi...' : 'Envoyer le lien' }}
              </button>
              <a routerLink="/compte/connexion">Retour à la connexion</a>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password { padding: 60px 0; }
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
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  sent = false;
  message = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  submit() {
    this.message = '';
    this.loading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.sent = true;
        this.message = res.message || 'Si cet email est associé à un compte, vous recevrez un lien de réinitialisation.';
      },
      error: (err) => {
        this.message = err.error?.message || 'Une erreur est survenue.';
        this.loading = false;
      }
    });
  }
}
