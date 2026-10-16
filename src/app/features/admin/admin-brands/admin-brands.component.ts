import { Component, OnInit } from '@angular/core';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl?: string;
}

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [AdminSidebarComponent, CommonModule, RouterModule, FormsModule],
  template: `
    <div class="admin-layout">
      <div class="container admin-layout-inner">
        <app-admin-sidebar></app-admin-sidebar>
        <main class="admin-main">
          <h1>Gestion des marques</h1>

          <div class="form-panel">
            <h2>{{ editingBrand ? 'Modifier la marque' : 'Nouvelle marque' }}</h2>
            <form (ngSubmit)="saveBrand()">
              <div class="form-row">
                <div class="form-group">
                  <label>Nom de la marque *</label>
                  <input type="text" [(ngModel)]="brandForm.name" name="brandName" required />
                </div>
                <div class="form-group">
                  <label>Slug (optionnel)</label>
                  <input type="text" [(ngModel)]="brandForm.slug" name="brandSlug" placeholder="Généré automatiquement si vide" />
                </div>
              </div>
              <div class="form-group">
                <label>URL du logo (optionnel)</label>
                <input type="url" [(ngModel)]="brandForm.logoUrl" name="brandLogoUrl" placeholder="https://..." />
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  {{ saving ? 'Enregistrement...' : (editingBrand ? 'Enregistrer' : 'Créer la marque') }}
                </button>
                @if (editingBrand) {
                  <button type="button" class="btn btn-secondary" (click)="cancelEdit()">Annuler</button>
                }
              </div>
            </form>
          </div>

          <div class="brands-panel">
            <h2>Marques existantes</h2>
            @if (loading) {
              <p>Chargement...</p>
            } @else if (brands.length === 0) {
              <p>Aucune marque. Créez-en une ci-dessus.</p>
            } @else {
              <table class="brands-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Slug</th>
                    <th>Logo</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (b of brands; track b.id) {
                    <tr>
                      <td>{{ b.name }}</td>
                      <td>{{ b.slug }}</td>
                      <td>
                        @if (b.logoUrl) {
                          <img [src]="b.logoUrl" alt="" class="brand-logo" />
                        } @else {
                          —
                        }
                      </td>
                      <td class="actions">
                        <button type="button" class="btn btn-small btn-secondary" (click)="editBrand(b)">Modifier</button>
                        <button type="button" class="btn btn-small btn-danger" (click)="confirmDelete(b)" [disabled]="deletingId === b.id">Supprimer</button>
                      </td>
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
    .admin-layout-inner { display: flex; align-items: flex-start; gap: 24px; }
    .admin-main { flex: 1; }
    .form-panel {
      background: white;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
      box-shadow: var(--shadow);
    }
    .form-panel h2 { margin-bottom: 16px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 600; }
    .form-group input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }
    .form-actions { display: flex; gap: 12px; margin-top: 20px; }
    .brands-panel {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .brands-panel h2 { margin-bottom: 16px; }
    .brands-table { width: 100%; border-collapse: collapse; }
    .brands-table th, .brands-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    .brands-table th { background: var(--secondary-color); font-weight: 600; }
    .brand-logo { max-width: 48px; max-height: 48px; object-fit: contain; }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-small { padding: 6px 12px; font-size: 13px; }
    .btn-danger { background: #c62828; color: white; border: none; }
    .btn-danger:hover:not(:disabled) { background: #b71c1c; }
    @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class AdminBrandsComponent implements OnInit {
  brands: Brand[] = [];
  loading = false;
  saving = false;
  deletingId: number | null = null;
  editingBrand: Brand | null = null;

  brandForm = { name: '', slug: '', logoUrl: '' };

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadBrands();
  }

  loadBrands() {
    this.loading = true;
    this.api.get<Brand[]>('/admin/brands').subscribe({
      next: (list) => {
        this.brands = list || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  saveBrand() {
    if (!this.brandForm.name.trim()) {
      this.toast.error('Le nom de la marque est obligatoire.');
      return;
    }
    this.saving = true;
    const body: any = {
      name: this.brandForm.name.trim(),
      slug: this.brandForm.slug?.trim() || undefined,
      logoUrl: this.brandForm.logoUrl?.trim() || undefined,
    };

    if (this.editingBrand) {
      this.api.patch<Brand>(`/admin/brands/${this.editingBrand.id}`, body).subscribe({
        next: () => {
          this.loadBrands();
          this.cancelEdit();
          this.toast.success('Marque mise à jour.');
          this.saving = false;
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Impossible de modifier la marque');
          this.saving = false;
        }
      });
    } else {
      this.api.post<Brand>('/admin/brands', body).subscribe({
        next: () => {
          this.brandForm = { name: '', slug: '', logoUrl: '' };
          this.loadBrands();
          this.toast.success('Marque créée.');
          this.saving = false;
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Impossible de créer la marque');
          this.saving = false;
        }
      });
    }
  }

  editBrand(b: Brand) {
    this.editingBrand = b;
    this.brandForm = {
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl ?? ''
    };
  }

  cancelEdit() {
    this.editingBrand = null;
    this.brandForm = { name: '', slug: '', logoUrl: '' };
  }

  confirmDelete(b: Brand) {
    if (!confirm(`Supprimer la marque « ${b.name} » ? Les produits associés perdront cette marque.`)) return;
    this.deletingId = b.id;
    this.api.delete(`/admin/brands/${b.id}`).subscribe({
      next: () => {
        this.loadBrands();
        this.deletingId = null;
        if (this.editingBrand?.id === b.id) this.cancelEdit();
        this.toast.success('Marque supprimée.');
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Impossible de supprimer');
        this.deletingId = null;
      }
    });
  }
}
