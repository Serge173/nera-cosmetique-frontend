import { Component, OnInit } from '@angular/core';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PricePipe } from '../../../shared/pipes/price.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AdminSidebarComponent, CommonModule, RouterModule, PricePipe],
  template: `
    <div class="admin-layout">
      <div class="container admin-layout-inner">
        <app-admin-sidebar></app-admin-sidebar>
        <main class="admin-main">
          <h1>Tableau de bord</h1>
          @if (stats.byStatus.pending > 0) {
            <div class="alert-pending">
              <strong>{{ stats.byStatus.pending }} commande(s) en attente</strong> – merci de les traiter rapidement.
            </div>
          }
          @if (loading) {
            <div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i> Chargement des statistiques...</div>
          } @else if (error) {
            <div class="error-state">{{ error }}</div>
          } @else {
          <section class="kpi-summary">
            <h2 class="section-title">Vue d'ensemble</h2>
            <div class="stats kpi-grid">
              <div class="stat-card primary">
                <h3>Chiffre d'affaires total</h3>
                <p class="stat-value">{{ stats.totalSales | price }}</p>
              </div>
              <div class="stat-card">
                <h3>Nombre de commandes</h3>
                <p class="stat-value">{{ stats.totalOrders }}</p>
              </div>
              <div class="stat-card">
                <h3>Panier moyen</h3>
                <p class="stat-value">{{ stats.averageOrderValue | price }}</p>
              </div>
              <div class="stat-card">
                <h3>Produits catalogués</h3>
                <p class="stat-value">{{ stats.totalProducts }}</p>
              </div>
              <div class="stat-card">
                <h3>Nombre de clients</h3>
                <p class="stat-value">{{ stats.totalUsers }}</p>
              </div>
              <div class="stat-card highlight">
                <h3>Mois dernier (CA)</h3>
                <p class="stat-value">{{ stats.lastMonthSales | price }}</p>
                <span class="stat-sub">{{ stats.lastMonthOrders }} commande(s)</span>
              </div>
            </div>
          </section>

          <h2 class="section-title">Commandes par statut (nombre)</h2>
          <div class="stats status-stats">
            <div class="stat-card small" [class.stat-card-pending]="stats.byStatus.pending > 0">
              <h3>En attente</h3>
              <p class="stat-value">{{ stats.byStatus.pending }}</p>
            </div>
            <div class="stat-card small">
              <h3>Payées</h3>
              <p class="stat-value">{{ stats.byStatus.paid }}</p>
            </div>
            <div class="stat-card small">
              <h3>En traitement</h3>
              <p class="stat-value">{{ stats.byStatus.processing }}</p>
            </div>
            <div class="stat-card small">
              <h3>Expédiées</h3>
              <p class="stat-value">{{ stats.byStatus.shipped }}</p>
            </div>
            <div class="stat-card small">
              <h3>Livrées</h3>
              <p class="stat-value">{{ stats.byStatus.delivered }}</p>
            </div>
            <div class="stat-card small">
              <h3>Annulées</h3>
              <p class="stat-value">{{ stats.byStatus.cancelled }}</p>
            </div>
          </div>

          <h2 class="section-title">Montant des ventes par statut</h2>
          <div class="stats status-stats">
            <div class="stat-card small">
              <h3>En attente</h3>
              <p class="stat-value">{{ (stats.totalsByStatusAmount.pending ?? 0) | price }}</p>
            </div>
            <div class="stat-card small">
              <h3>Payées</h3>
              <p class="stat-value">{{ (stats.totalsByStatusAmount.paid ?? 0) | price }}</p>
            </div>
            <div class="stat-card small">
              <h3>En traitement</h3>
              <p class="stat-value">{{ (stats.totalsByStatusAmount.processing ?? 0) | price }}</p>
            </div>
            <div class="stat-card small">
              <h3>Expédiées</h3>
              <p class="stat-value">{{ (stats.totalsByStatusAmount.shipped ?? 0) | price }}</p>
            </div>
            <div class="stat-card small">
              <h3>Livrées</h3>
              <p class="stat-value">{{ (stats.totalsByStatusAmount.delivered ?? 0) | price }}</p>
            </div>
            <div class="stat-card small">
              <h3>Annulées</h3>
              <p class="stat-value">{{ (stats.totalsByStatusAmount.cancelled ?? 0) | price }}</p>
            </div>
          </div>

          <h2 class="section-title">Ventes mensuelles (12 derniers mois)</h2>
          <div class="table-wrap">
            <table class="data-table" *ngIf="monthlySalesDisplay.length > 0; else noMonthlySales">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Nb commandes</th>
                  <th>Chiffre d'affaires</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of monthlySalesDisplay">
                  <td>{{ m.label }}</td>
                  <td>{{ m.ordersCount }}</td>
                  <td>{{ m.totalSales | price }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noMonthlySales>
            <p class="empty-msg">Aucune vente enregistrée.</p>
          </ng-template>

          <h2 class="section-title">Ventes par catégorie</h2>
          <div class="table-wrap">
            <table class="data-table" *ngIf="(stats.categoriesSales || []).length > 0; else noCategorySales">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>CA</th>
                  <th>Part</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of (stats.categoriesSales || [])">
                  <td>{{ c.categoryName }}</td>
                  <td>{{ c.totalSales | price }}</td>
                  <td>{{ (c.percent !== undefined ? c.percent : 0) | number:'1.1-1' }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noCategorySales>
            <p class="empty-msg">Aucune vente par catégorie.</p>
          </ng-template>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout { padding: 32px 0; }
    .admin-layout-inner { display: flex; align-items: flex-start; gap: 24px; }
    .admin-main { flex: 1; }
    .loading-state, .error-state {
      padding: 32px;
      text-align: center;
      font-size: 16px;
    }
    .loading-state { color: var(--primary-color); }
    .error-state { color: #c62828; }
    .section-title { margin-top: 32px; margin-bottom: 16px; font-size: 18px; font-weight: 600; }
    .section-title:first-of-type { margin-top: 0; }
    .stats { display: grid; gap: 20px; }
    .kpi-grid {
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      margin-top: 0;
    }
    .status-stats {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      margin-top: 0;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: var(--shadow);
      border-left: 4px solid var(--border-color);
    }
    .stat-card.primary { border-left-color: var(--primary-color); }
    .stat-card.highlight { border-left-color: #4caf50; }
    .stat-card h3 { color: var(--text-light); font-size: 13px; margin-bottom: 8px; font-weight: 600; }
    .stat-card .stat-value { font-size: 24px; font-weight: 700; color: var(--primary-color); margin: 0; }
    .stat-card.small .stat-value { font-size: 18px; }
    .stat-card .stat-sub { font-size: 12px; color: var(--text-light); display: block; margin-top: 4px; }
    .stat-card-pending {
      border-left-color: #ff1744; /* rouge très vif */
      background: #ffebee;
    }
    .alert-pending {
      margin: 12px 0 20px;
      padding: 12px 16px;
      border-radius: 8px;
      background: #ff1744; /* bande rouge vif */
      color: #ffffff;
      border: 1px solid #b71c1c;
      font-size: 0.9rem;
      animation: alert-blink 1.4s ease-in-out infinite;
    }
    @keyframes alert-blink {
      0% { opacity: 1; box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.5); }
      50% { opacity: 0.6; box-shadow: 0 0 12px 4px rgba(255, 23, 68, 0.6); }
      100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.0); }
    }
    .table-wrap { margin-top: 12px; overflow-x: auto; background: white; border-radius: 8px; box-shadow: var(--shadow); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-color); text-align: left; }
    .data-table th { background: var(--bg-light, #f8f8f8); font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table td:last-child { text-align: right; }
    .empty-msg { color: var(--text-light); font-size: 14px; margin: 16px 0; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  loading = true;
  error = '';
  stats = {
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    averageOrderValue: 0,
    lastMonthSales: 0,
    lastMonthOrders: 0,
    byStatus: {
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
    categoriesSales: [] as { categoryId: number; categoryName: string; totalSales: number; percent?: number }[],
    totalsByStatusAmount: {
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    },
    monthlySales: [] as { year: number; month: number; label: string; totalSales: number; ordersCount: number }[],
  };

  get monthlySalesDisplay() {
    const arr = this.stats.monthlySales ?? [];
    return [...arr].reverse();
  }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get('/admin/stats').subscribe({
      next: (stats: any) => {
        this.stats = { ...this.stats, ...stats };
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Impossible de charger les statistiques.';
        this.loading = false;
      },
    });
  }
}
