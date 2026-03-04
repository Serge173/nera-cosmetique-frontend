import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="login">
      <div class="container">
        <div class="login-form">
          <h1>Connexion</h1>
          <form (ngSubmit)="login()">
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="email" name="email" required />
            </div>
            <div class="form-group">
              <label>Mot de passe</label>
              <input type="password" [(ngModel)]="password" name="password" required />
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="loading">
              {{ loading ? 'Connexion...' : 'Se connecter' }}
            </button>
            <a routerLink="/compte/inscription">Créer un compte</a>
            <a routerLink="/compte/mot-de-passe-oublie">Mot de passe oublié ?</a>
            <button type="button" class="link-dev-reset" (click)="devResetPassword()">
              Débloquer la connexion (réinitialiser le mot de passe pour cet email)
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login {
      padding: 60px 0;
    }
    .login-form {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      padding: 32px;
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .form-group {
      margin-bottom: 24px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }
    .btn {
      width: 100%;
      margin-bottom: 16px;
    }
    a {
      display: block;
      text-align: center;
      color: var(--primary-color);
      margin-top: 8px;
    }
    .link-dev-reset {
      display: block;
      width: 100%;
      margin-top: 16px;
      padding: 8px;
      background: none;
      border: none;
      font-size: 12px;
      color: var(--text-light);
      cursor: pointer;
      text-align: center;
      text-decoration: underline;
    }
    .link-dev-reset:hover { color: var(--primary-color); }
    @media (max-width: 480px) {
      .login {
        padding: 32px 0;
      }
      .login-form {
        padding: 24px 20px;
      }
      .btn {
        min-height: 48px;
      }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  login() {
    const email = this.email.trim();
    const password = this.password.trim();
    if (!email || !password) {
      this.toast.error('Renseignez l\'email et le mot de passe');
      return;
    }
    this.loading = true;
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/compte';
    this.authService.login(email, password).subscribe({
      next: () => {
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.toast.error(err?.message || 'Email ou mot de passe incorrect');
        this.loading = false;
      }
    });
  }

  /** En dev : réinitialise le mot de passe pour l’email saisi (mot de passe fixe). */
  devResetPassword() {
    const email = this.email.trim();
    if (!email) {
      this.toast.error('Indiquez l’email du compte à débloquer');
      return;
    }
    const newPassword = 'Password123!';
    this.api.post<{ ok: boolean; message: string }>('/auth/dev-reset-password', { email, newPassword }).subscribe({
      next: (res) => {
        if (res.ok) {
          this.password = newPassword;
          this.toast.success(res.message + ' Mot de passe : ' + newPassword);
        } else {
          this.toast.error(res.message);
        }
      },
      error: (err) => this.toast.error(err?.message || 'Erreur lors de la réinitialisation')
    });
  }
}
