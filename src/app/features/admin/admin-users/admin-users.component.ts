import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="admin-main legacy-page">
          <div class="admin-header">
            <h1>Gestion des utilisateurs</h1>
            <button type="button" class="btn btn-primary" (click)="showForm = !showForm">
              {{ showForm ? 'Fermer le formulaire' : '+ Créer un compte' }}
            </button>
          </div>

          @if (showForm) {
            <div class="user-form">
              <h2>Nouveau compte utilisateur</h2>
              <form (ngSubmit)="createUser()">
                <div class="form-row">
                  <div class="form-group">
                    <label>Email *</label>
                    <input type="email" [(ngModel)]="form.email" name="email" required />
                  </div>
                  <div class="form-group">
                    <label>Rôle</label>
                    <select [(ngModel)]="form.role" name="role">
                      <option value="customer">Client</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Prénom</label>
                    <input type="text" [(ngModel)]="form.firstName" name="firstName" />
                  </div>
                  <div class="form-group">
                    <label>Nom</label>
                    <input type="text" [(ngModel)]="form.lastName" name="lastName" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Téléphone</label>
                    <input type="tel" [(ngModel)]="form.phone" name="phone" />
                  </div>
                  <div class="form-group">
                    <label>Mot de passe *</label>
                    <input type="password" [(ngModel)]="form.password" name="password" required minlength="6" />
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary" [disabled]="saving">
                    {{ saving ? 'Création...' : 'Créer le compte' }}
                  </button>
                </div>
              </form>
            </div>
          }

          <div class="users-table">
            @if (loading) {
              <p>Chargement...</p>
            } @else if (users.length === 0) {
              <p>Aucun utilisateur.</p>
            } @else {
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Nom</th>
                    <th>Téléphone</th>
                    <th>Rôle</th>
                    <th>Actif</th>
                    <th>Inscrit le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of users; track u.id) {
                    <tr>
                      <td>{{ u.email }}</td>
                      <td>{{ u.firstName }} {{ u.lastName }}</td>
                      <td>{{ u.phone || '-' }}</td>
                      <td><span class="role-badge" [class.admin]="u.role === 'admin'">{{ u.role }}</span></td>
                      <td>{{ u.isActive ? 'Oui' : 'Non' }}</td>
                      <td>{{ u.createdAt | date:'shortDate' }}</td>
                      <td class="actions">
                        <button type="button" class="btn-link" (click)="toggleActive(u)">
                          {{ u.isActive ? 'Suspendre' : 'Réactiver' }}
                        </button>
                        <button type="button" class="btn-link danger" (click)="confirmDelete(u)">Supprimer</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
  `,
  styles: [`
    .admin-layout { padding: 32px 0; }
    .admin-layout-inner {
      display: flex;
      align-items: flex-start;
      gap: 24px;
    }
    .admin-main {
      flex: 1;
    }
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .user-form {
      background: white;
      border-radius: 8px;
      padding: 20px 24px;
      box-shadow: var(--shadow);
      margin-bottom: 20px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .form-group {
      margin-bottom: 12px;
    }
    .form-group label {
      display: block;
      margin-bottom: 4px;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
    }
    .form-actions {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
    }
    .users-table {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--shadow);
      margin-top: 24px;
    }
    .users-table table {
      width: 100%;
      border-collapse: collapse;
    }
    .users-table th, .users-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    .users-table th {
      background: var(--secondary-color);
      font-weight: 600;
    }
    .role-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      background: #e0e0e0;
    }
    .role-badge.admin {
      background: var(--primary-color);
      color: white;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 140px;
    }
    .btn-link {
      background: none;
      border: none;
      padding: 0;
      color: var(--primary-color);
      cursor: pointer;
      font-size: 0.875rem;
      text-align: left;
    }
    .btn-link.danger {
      color: #c62828;
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  loading = false;
  saving = false;
  showForm = false;
  form = {
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'customer' as 'customer' | 'admin',
    password: ''
  };

  constructor(
    private api: ApiService,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.api.get<AdminUser[]>('/admin/users').subscribe({
      next: (list) => {
        this.users = list || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  createUser() {
    const email = this.form.email.trim();
    const password = this.form.password.trim();
    if (!email || !password) {
      this.toast.error('Email et mot de passe sont obligatoires.');
      return;
    }
    if (password.length < 6) {
      this.toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    this.saving = true;
    const body = {
      email,
      firstName: this.form.firstName.trim() || undefined,
      lastName: this.form.lastName.trim() || undefined,
      phone: this.form.phone.trim() || undefined,
      role: this.form.role,
      password,
      isActive: true,
    };
    this.api.post<AdminUser>('/admin/users', body).subscribe({
      next: () => {
        this.saving = false;
        this.toast.success('Compte utilisateur créé.');
        this.showForm = false;
        this.form = {
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          role: 'customer',
          password: ''
        };
        this.loadUsers();
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.message || 'Impossible de créer le compte.';
        this.toast.error(msg);
      }
    });
  }

  toggleActive(user: AdminUser) {
    const newActive = !user.isActive;
    this.api.patch<AdminUser>(`/admin/users/${user.id}/status`, { isActive: newActive }).subscribe({
      next: (updated) => {
        user.isActive = updated.isActive;
        this.toast.info(newActive ? 'Compte réactivé.' : 'Compte suspendu.');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Impossible de modifier le statut du compte.';
        this.toast.error(msg);
      }
    });
  }

  confirmDelete(user: AdminUser) {
    if (!confirm(`Supprimer le compte « ${user.email} » ? Cette action est irréversible.`)) return;
    this.api.delete(`/admin/users/${user.id}`).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.toast.success('Compte utilisateur supprimé.');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Impossible de supprimer le compte.';
        this.toast.error(msg);
      }
    });
  }
}

