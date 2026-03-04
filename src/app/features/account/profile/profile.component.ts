import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="profile">
      <div class="container">
        <h1>Mon compte</h1>
        @if (user) {
          <div class="profile-content">
            <nav class="account-nav">
              <a routerLink="/compte" routerLinkActive="active">Profil</a>
              <a routerLink="/compte/commandes" routerLinkActive="active">Mes commandes</a>
            </nav>
            <div class="profile-form">
              <h2>Mes informations</h2>
              <form (ngSubmit)="updateProfile()">
                <div class="form-group">
                  <label>Prénom</label>
                  <input type="text" [(ngModel)]="user.firstName" name="firstName" />
                </div>
                <div class="form-group">
                  <label>Nom</label>
                  <input type="text" [(ngModel)]="user.lastName" name="lastName" />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" [(ngModel)]="user.email" name="email" readonly class="input-readonly" />
                </div>
                <div class="form-group">
                  <label>Téléphone</label>
                  <input type="tel" [(ngModel)]="user.phone" name="phone" />
                </div>
                <button type="submit" class="btn btn-primary">Mettre à jour</button>
              </form>
            </div>
            <div class="profile-form password-form">
              <h2><i class="fa-solid fa-lock"></i> Changer le mot de passe</h2>
              <p class="form-description">Utilisez un mot de passe d’au moins 6 caractères. Après modification, utilisez le nouveau mot de passe pour vous connecter.</p>
              <form (ngSubmit)="changePassword()" #passwordForm="ngForm">
                <div class="form-group">
                  <label for="currentPassword">Mot de passe actuel <span class="required">*</span></label>
                  <input
                    id="currentPassword"
                    type="password"
                    [(ngModel)]="passwordFormModel.currentPassword"
                    name="currentPassword"
                    autocomplete="current-password"
                    required
                    [disabled]="passwordLoading"
                  />
                  @if (passwordError) {
                    <p class="field-error" role="alert">{{ passwordError }}</p>
                  }
                </div>
                <div class="form-group">
                  <label for="newPassword">Nouveau mot de passe <span class="required">*</span></label>
                  <input
                    id="newPassword"
                    type="password"
                    [(ngModel)]="passwordFormModel.newPassword"
                    name="newPassword"
                    autocomplete="new-password"
                    required
                    minlength="6"
                    [disabled]="passwordLoading"
                  />
                  <p class="field-hint">Minimum 6 caractères</p>
                </div>
                <div class="form-group">
                  <label for="confirmPassword">Confirmer le nouveau mot de passe <span class="required">*</span></label>
                  <input
                    id="confirmPassword"
                    type="password"
                    [(ngModel)]="passwordFormModel.confirmPassword"
                    name="confirmPassword"
                    autocomplete="new-password"
                    required
                    [disabled]="passwordLoading"
                  />
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" [disabled]="passwordLoading || !passwordForm.valid">
                    {{ passwordLoading ? 'Enregistrement…' : 'Mettre à jour le mot de passe' }}
                  </button>
                  <button type="button" class="btn btn-secondary" (click)="resetPasswordForm()" [disabled]="passwordLoading">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .profile {
      padding: 32px 0;
    }
    .account-nav {
      display: flex;
      gap: 24px;
      margin-bottom: 32px;
      border-bottom: 2px solid var(--border-color);
    }
    .account-nav a {
      padding: 12px 0;
      color: var(--text-dark);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
    }
    .account-nav a.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }
    .profile-form {
      background: white;
      padding: 32px;
      border-radius: 8px;
      box-shadow: var(--shadow);
      margin-bottom: 24px;
    }
    .profile-form.password-form {
      margin-top: 32px;
    }
    .profile-form h2 {
      margin: 0 0 20px;
      font-size: 1.25rem;
      color: var(--text-dark);
    }
    .profile-form h2 i {
      margin-right: 8px;
      color: var(--primary-color);
    }
    .form-description {
      font-size: 0.9375rem;
      color: var(--text-light);
      margin: -8px 0 20px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 0.9375rem;
    }
    .form-group .required {
      color: #c62828;
    }
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 1rem;
    }
    .form-group input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(255, 102, 0, 0.15);
    }
    .form-group input.input-readonly {
      background: var(--bg-light, #f5f5f5);
      color: var(--text-light);
    }
    .form-group input:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .field-hint {
      font-size: 0.8125rem;
      color: var(--text-light);
      margin: 6px 0 0;
    }
    .field-error {
      font-size: 0.875rem;
      color: #c62828;
      margin: 6px 0 0;
    }
    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: var(--primary-color);
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      filter: brightness(1.05);
    }
    .btn-secondary {
      background: #f0f0f0;
      color: var(--text-dark);
    }
    .btn-secondary:hover:not(:disabled) {
      background: #e0e0e0;
    }
    .btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    @media (max-width: 768px) {
      .profile-form {
        padding: 24px 20px;
      }
    }
    @media (max-width: 480px) {
      .profile {
        padding: 24px 0;
      }
      .form-actions {
        flex-direction: column;
      }
      .form-actions .btn {
        width: 100%;
        min-height: 48px;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  passwordFormModel = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  passwordLoading = false;
  passwordError = '';

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
    });
  }

  updateProfile(): void {
    this.toast.error('La mise à jour du profil n’est pas encore disponible.');
  }

  changePassword(): void {
    this.passwordError = '';
    const cur = this.passwordFormModel.currentPassword.trim();
    const newP = this.passwordFormModel.newPassword.trim();
    const conf = this.passwordFormModel.confirmPassword.trim();
    if (!cur) {
      this.passwordError = 'Indiquez votre mot de passe actuel.';
      return;
    }
    if (newP.length < 6) {
      this.passwordError = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
      return;
    }
    if (newP !== conf) {
      this.passwordError = 'Les deux mots de passe ne correspondent pas.';
      return;
    }
    if (cur === newP) {
      this.passwordError = 'Le nouveau mot de passe doit être différent de l’actuel.';
      return;
    }
    this.passwordLoading = true;
    this.api.post<{ success: boolean; message: string }>('/auth/change-password', {
      currentPassword: cur,
      newPassword: newP,
    }).subscribe({
      next: (res) => {
        this.passwordLoading = false;
        this.resetPasswordForm();
        this.toast.success(res?.message ?? 'Mot de passe mis à jour.');
      },
      error: (err) => {
        this.passwordLoading = false;
        const msg = err?.error?.message ?? err?.message ?? 'Impossible de modifier le mot de passe.';
        this.passwordError = msg;
        this.toast.error(msg);
      },
    });
  }

  resetPasswordForm(): void {
    this.passwordFormModel = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.passwordError = '';
  }
}
