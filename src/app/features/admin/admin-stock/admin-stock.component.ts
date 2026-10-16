import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { PricePipe } from '../../../shared/pipes/price.pipe';

interface AdminStockProduct {
  id: number;
  name: string;
  slug: string;
  categoryName: string;
  brandName?: string;
  stockQuantity: number;
  price: number;
}

interface AdminStockSummaryByCategory {
  categoryId: number;
  categoryName: string;
  totalStock: number;
  productCount: number;
}

@Component({
  selector: 'app-admin-stock',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PricePipe],
  template: `
    <div class="admin-main legacy-page">
          <h1>Gestion des stocks</h1>

          @if (loading) {
            <p class="loading">Chargement des données de stock...</p>
          } @else if (error) {
            <p class="error">{{ error }}</p>
          } @else {
            <section class="stock-kpis">
              <div class="stat-card primary">
                <h3>Articles en stock (tous produits)</h3>
                <p class="stat-value">{{ totalUnits }}</p>
              </div>
              <div class="stat-card">
                <h3>Produits suivis</h3>
                <p class="stat-value">{{ products.length }}</p>
              </div>
              <div class="stat-card">
                <h3>Catégories avec stock</h3>
                <p class="stat-value">{{ summaryByCategory.length }}</p>
              </div>
              <div class="stat-card alert" *ngIf="lowStockCount > 0">
                <h3>Produits en alerte stock</h3>
                <p class="stat-value">{{ lowStockCount }}</p>
                <p class="stat-sub">Stock strictement inférieur à {{ lowStockThreshold }}</p>
              </div>
            </section>

            <section class="stock-section">
              <h2>Répartition des stocks par catégorie</h2>
              <div class="table-wrap">
                <table class="data-table" *ngIf="summaryByCategory.length > 0; else noCategoryStock">
                  <thead>
                    <tr>
                      <th>Catégorie</th>
                      <th>Nb produits</th>
                      <th>Stock total (unités)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let c of summaryByCategory">
                      <td>{{ c.categoryName }}</td>
                      <td>{{ c.productCount }}</td>
                      <td>{{ c.totalStock }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ng-template #noCategoryStock>
                <p class="empty">Aucun stock enregistré pour le moment.</p>
              </ng-template>
            </section>

            <section class="stock-section">
              <h2>Détail des stocks par produit</h2>
              <div class="filters">
                <label>
                  Filtrer par nom ou catégorie :
                  <input type="text" [(ngModel)]="search" placeholder="Rechercher un produit ou une catégorie" />
                </label>
                <label>
                  Seuil alerte:
                  <input type="number" [(ngModel)]="lowStockThreshold" min="0" />
                </label>
              </div>
              <div class="table-wrap">
                <table class="data-table" *ngIf="filteredProducts.length > 0; else noProductStock">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Catégorie</th>
                      <th>Marque</th>
                      <th>Prix</th>
                      <th>Stock</th>
                      <th>État</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let p of filteredProducts">
                      <td>{{ p.name }}</td>
                      <td>{{ p.categoryName }}</td>
                      <td>{{ p.brandName || '—' }}</td>
                      <td>{{ p.price | price }}</td>
                      <td>{{ p.stockQuantity }}</td>
                      <td>
                        <span
                          class="badge"
                          [class.badge-low]="p.stockQuantity > 0 && p.stockQuantity < lowStockThreshold"
                          [class.badge-out]="p.stockQuantity === 0"
                          [class.badge-ok]="p.stockQuantity >= lowStockThreshold"
                        >
                          @if (p.stockQuantity === 0) {
                            Rupture
                          } @else if (p.stockQuantity < lowStockThreshold) {
                            Faible
                          } @else {
                            OK
                          }
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ng-template #noProductStock>
                <p class="empty">Aucun produit ne correspond à ce filtre.</p>
              </ng-template>
            </section>
          }
        </div>
  `,
  styles: [`
    .admin-layout { padding: 32px 0; }
    .admin-layout-inner { display: flex; align-items: flex-start; gap: 24px; }
    .admin-main { flex: 1; }
    .loading { color: var(--primary-color); }
    .error { color: #c62828; }
    .stock-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 24px 0;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: var(--shadow);
      border-left: 4px solid var(--border-color);
    }
    .stat-card.primary { border-left-color: var(--primary-color); }
    .stat-card.alert { border-left-color: #f57c00; }
    .stat-card h3 { margin: 0 0 8px; font-size: 14px; color: var(--text-light); }
    .stat-card .stat-value { margin: 0; font-size: 24px; font-weight: 700; color: var(--primary-color); }
    .stat-card .stat-sub { font-size: 12px; color: var(--text-light); margin-top: 4px; }
    .stock-section { margin-top: 32px; }
    .stock-section h2 { font-size: 18px; font-weight: 600; margin-bottom: 12px; }
    .table-wrap { overflow-x: auto; background: white; border-radius: 8px; box-shadow: var(--shadow); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td {
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-color);
      text-align: left;
      font-size: 14px;
    }
    .data-table th {
      background: var(--bg-light, #f8f8f8);
      font-weight: 600;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      margin-bottom: 16px;
    }
    .filters label {
      font-size: 14px;
      color: var(--text-light);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .filters input[type="text"],
    .filters input[type="number"] {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      min-width: 200px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-ok { background: #e8f5e9; color: #2e7d32; }
    .badge-low { background: #fff8e1; color: #ef6c00; }
    .badge-out { background: #ffebee; color: #c62828; }
    .empty { margin-top: 8px; color: var(--text-light); }
    @media (max-width: 768px) {
      .admin-layout-inner { flex-direction: column; }
    }
  `]
})
export class AdminStockComponent implements OnInit {
  loading = true;
  error = '';
  products: AdminStockProduct[] = [];
  summaryByCategory: AdminStockSummaryByCategory[] = [];
  totalUnits = 0;
  lowStockThreshold = 5;
  search = '';

  get filteredProducts(): AdminStockProduct[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.products;
    return this.products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.categoryName.toLowerCase().includes(term) ||
      (p.brandName ?? '').toLowerCase().includes(term),
    );
  }

  get lowStockCount(): number {
    return this.products.filter(p => p.stockQuantity > 0 && p.stockQuantity < this.lowStockThreshold).length;
  }

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // On réutilise l’endpoint admin produits pour récupérer toutes les infos nécessaires.
    this.api.get<any>('/admin/products').subscribe({
      next: (res) => {
        const list = res?.products ?? [];
        this.products = list.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          categoryName: p.category?.name ?? 'Sans catégorie',
          brandName: p.brand?.name ?? undefined,
          stockQuantity: Number(p.stockQuantity ?? 0),
          price: Number(p.price ?? 0),
        }));
        this.totalUnits = this.products.reduce((sum, p) => sum + p.stockQuantity, 0);
        this.summaryByCategory = this.buildSummaryByCategory(this.products);
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Impossible de charger les données de stock.';
        this.loading = false;
      },
    });
  }

  private buildSummaryByCategory(products: AdminStockProduct[]): AdminStockSummaryByCategory[] {
    const map = new Map<number | string, AdminStockSummaryByCategory & { key: number | string }>();
    for (const p of products) {
      const key = p.categoryName || 'Sans catégorie';
      const existing = map.get(key);
      if (existing) {
        existing.totalStock += p.stockQuantity;
        existing.productCount += 1;
      } else {
        map.set(key, {
          key,
          categoryId: 0,
          categoryName: p.categoryName,
          totalStock: p.stockQuantity,
          productCount: 1,
        });
      }
    }
    return Array.from(map.values()).map(({ key, ...rest }) => rest).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName),
    );
  }
}

