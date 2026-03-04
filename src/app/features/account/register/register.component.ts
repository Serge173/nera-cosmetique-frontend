import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="register">
      <div class="container">
        <div class="register-form">
          <h1>Inscription</h1>
          <form (ngSubmit)="register()">
            <div class="form-row">
              <div class="form-group">
                <label>Prénom *</label>
                <input type="text" [(ngModel)]="firstName" name="firstName" required />
              </div>
              <div class="form-group">
                <label>Nom *</label>
                <input type="text" [(ngModel)]="lastName" name="lastName" required />
              </div>
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" [(ngModel)]="email" name="email" required />
            </div>
            <div class="form-group">
              <label>Téléphone</label>
              <input type="tel" [(ngModel)]="phone" name="phone" />
            </div>
            <div class="form-group">
              <label>Mot de passe *</label>
              <input type="password" [(ngModel)]="password" name="password" required />
            </div>
            <div class="form-group">
              <label>Confirmer mot de passe *</label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required />
            </div>
            <button type="submit" class="btn btn-primary" [disabled]="loading || password !== confirmPassword">
              {{ loading ? 'Inscription...' : 'Créer mon compte' }}
            </button>
            <a routerLink="/compte/connexion">Déjà un compte ? Se connecter</a>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register {
      padding: 60px 0;
    }
    .register-form {
      max-width: 500px;
      margin: 0 auto;
      background: white;
      padding: 32px;
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
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
    }
    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 480px) {
      .register {
        padding: 32px 0;
      }
      .register-form {
        padding: 24px 20px;
      }
      .btn {
        min-height: 48px;
      }
    }
  `]
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  register() {
    const email = this.email.trim();
    const password = this.password.trim();
    const confirmPassword = this.confirmPassword.trim();
    if (password !== confirmPassword) {
      this.toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      this.toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    this.loading = true;
    this.authService.register({
      email,
      password,
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      phone: this.phone?.trim() || undefined
    }).subscribe({
      next: () => {
        this.router.navigate(['/compte']);
      },
      error: (err) => {
        this.toast.error(err?.message || 'Erreur lors de l\'inscription');
        this.loading = false;
      }
    });
  }
}
