import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
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
          <h1>Dashboard Admin</h1>
          <div class="stats">
            <div class="stat-card">
              <h3>Total ventes</h3>
              <p>{{ stats.totalSales | number }} FCFA</p>
            </div>
            <div class="stat-card">
              <h3>Commandes</h3>
              <p>{{ stats.totalOrders }}</p>
            </div>
            <div class="stat-card">
              <h3>Produits</h3>
              <p>{{ stats.totalProducts }}</p>
            </div>
          </div>

          <h2 class="section-title">Commandes par statut</h2>
          <div class="stats status-stats">
            <div class="stat-card small">
              <h3>En attente</h3>
              <p>{{ stats.byStatus.pending }}</p>
            </div>
            <div class="stat-card small">
              <h3>Payées</h3>
              <p>{{ stats.byStatus.paid }}</p>
            </div>
            <div class="stat-card small">
              <h3>En traitement</h3>
              <p>{{ stats.byStatus.processing }}</p>
            </div>
            <div class="stat-card small">
              <h3>Expédiées</h3>
              <p>{{ stats.byStatus.shipped }}</p>
            </div>
            <div class="stat-card small">
              <h3>Livrées</h3>
              <p>{{ stats.byStatus.delivered }}</p>
            </div>
            <div class="stat-card small">
              <h3>Annulées</h3>
              <p>{{ stats.byStatus.cancelled }}</p>
            </div>
          </div>

          <h2 class="section-title">Ventes par catégorie</h2>
          <table class="category-sales" *ngIf="stats.categoriesSales.length > 0; else noCategorySales">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Total des ventes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of stats.categoriesSales">
                <td>{{ c.categoryName }}</td>
                <td>{{ c.totalSales | number }} FCFA</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noCategorySales>
            <p>Aucune vente enregistrée pour le moment.</p>
          </ng-template>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      padding: 32px 0;
    }
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
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 24px;
      margin-top: 32px;
    }
    .status-stats {
      margin-top: 16px;
    }
    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .stat-card.small p {
      font-size: 24px;
    }
    .section-title {
      margin-top: 32px;
      font-size: 18px;
      font-weight: 600;
    }
    .category-sales {
      width: 100%;
      margin-top: 16px;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--shadow);
    }
    .category-sales th,
    .category-sales td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }
    .category-sales th {
      background: var(--bg-light);
      font-weight: 600;
    }
    .category-sales tr:last-child td {
      border-bottom: none;
    }
    .stat-card h3 {
      color: var(--text-light);
      font-size: 14px;
      margin-bottom: 8px;
    }
    .stat-card p {
      font-size: 32px;
      font-weight: 600;
      color: var(--primary-color);
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats = {
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    byStatus: {
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
    categoriesSales: [] as { categoryId: number; categoryName: string; totalSales: number }[],
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get('/admin/stats').subscribe((stats: any) => {
      this.stats = stats;
    });
  }
}
