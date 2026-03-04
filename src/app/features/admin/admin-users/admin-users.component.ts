import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

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
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <div class="container admin-layout-inner">
        <aside class="admin-sidebar">
          <div class="sidebar-logo">Nera Admin</div>
          <nav class="sidebar-menu">
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Tableau de bord</a>
            <a routerLink="/admin/categories" routerLinkActive="active">Catégories</a>
            <a routerLink="/admin/orders" routerLinkActive="active">Commandes</a>
            <a routerLink="/admin/products" routerLinkActive="active">Produits</a>
            <a routerLink="/admin/users" routerLinkActive="active">Utilisateurs</a>
          </nav>
        </aside>
        <main class="admin-main">
          <h1>Gestion des utilisateurs</h1>
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
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </main>
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
    .admin-sidebar {
      width: 240px;
      background: var(--white);
      border-radius: 8px;
      box-shadow: var(--shadow);
      padding: 24px 16px;
      position: sticky;
      top: 90px;
      align-self: flex-start;
    }
    .sidebar-logo {
      font-weight: 700;
      font-size: 18px;
      color: var(--primary-color);
      margin-bottom: 16px;
    }
    .sidebar-menu {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sidebar-menu a {
      padding: 8px 12px;
      border-radius: 6px;
      color: var(--text-dark);
      font-size: 14px;
    }
    .sidebar-menu a.active {
      background: var(--primary-color);
      color: var(--white);
    }
    .admin-main {
      flex: 1;
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
  `]
})
export class AdminUsersComponent implements OnInit {
  users: AdminUser[] = [];
  loading = false;

  constructor(private api: ApiService) {}

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
}

