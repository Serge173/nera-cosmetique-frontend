import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
          <h1>Gestion des catégories</h1>

          <div class="form-panel">
            <h2>{{ editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h2>
            <form (ngSubmit)="saveCategory()">
              <div class="form-row">
                <div class="form-group">
                  <label>Nom de la catégorie *</label>
                  <input type="text" [(ngModel)]="categoryForm.name" name="categoryName" required />
                </div>
                <div class="form-group">
                  <label>Catégorie parente</label>
                  <select [(ngModel)]="categoryForm.parentId" name="parentId">
                    <option [ngValue]="null">Aucune (catégorie racine)</option>
                    @for (cat of categories; track cat.id) {
                      @if (!editingCategory || cat.id !== editingCategory.id) {
                        <option [ngValue]="cat.id">{{ cat.name }}</option>
                      }
                    }
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <input type="text" [(ngModel)]="categoryForm.description" name="categoryDescription" />
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  {{ saving ? 'Enregistrement...' : (editingCategory ? 'Enregistrer' : 'Créer la catégorie') }}
                </button>
                @if (editingCategory) {
                  <button type="button" class="btn btn-secondary" (click)="cancelEdit()">Annuler</button>
                }
              </div>
            </form>
          </div>

          <div class="categories-panel">
            <h2>Catégories existantes</h2>
            @if (loading) {
              <p>Chargement...</p>
            } @else if (categories.length === 0) {
              <p>Aucune catégorie. Créez-en une ci-dessus.</p>
            } @else {
              <table class="categories-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Slug</th>
                    <th>Parente</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cat of categories; track cat.id) {
                    <tr [class.suspended]="cat.isActive === false">
                      <td>{{ cat.name }}</td>
                      <td>{{ cat.slug }}</td>
                      <td>{{ getParentName(cat.parentId) }}</td>
                      <td>
                        @if (cat.isActive !== false) {
                          <span class="badge badge-active">Actif</span>
                        } @else {
                          <span class="badge badge-suspended">Suspendu</span>
                        }
                      </td>
                      <td class="actions">
                        <button type="button" class="btn btn-small btn-secondary" (click)="editCategory(cat)">Modifier</button>
                        <button type="button" class="btn btn-small" [class.btn-warning]="cat.isActive !== false" [class.btn-success]="cat.isActive === false" (click)="toggleActive(cat)" [disabled]="togglingId === cat.id">
                          {{ cat.isActive !== false ? 'Suspendre' : 'Activer' }}
                        </button>
                        <button type="button" class="btn btn-small btn-danger" (click)="confirmDelete(cat)" [disabled]="deletingId === cat.id">Supprimer</button>
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
    .sidebar-menu { display: flex; flex-direction: column; gap: 8px; }
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
    .form-group input, .form-group select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }
    .form-actions { display: flex; gap: 12px; margin-top: 20px; }
    .categories-panel {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .categories-panel h2 { margin-bottom: 16px; }
    .categories-table {
      width: 100%;
      border-collapse: collapse;
    }
    .categories-table th, .categories-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    .categories-table th {
      background: var(--secondary-color);
      font-weight: 600;
    }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .btn-small { padding: 6px 12px; font-size: 13px; }
    .btn-danger { background: #c62828; color: white; border: none; }
    .btn-danger:hover:not(:disabled) { background: #b71c1c; }
    .btn-warning { background: #f9a825; color: #333; border: none; }
    .btn-warning:hover:not(:disabled) { background: #f57f17; }
    .btn-success { background: #2e7d32; color: white; border: none; }
    .btn-success:hover:not(:disabled) { background: #1b5e20; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-active { background: #e8f5e9; color: #2e7d32; }
    .badge-suspended { background: #ffebee; color: #c62828; }
    tr.suspended { opacity: 0.75; }
    @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  saving = false;
  togglingId: number | null = null;
  deletingId: number | null = null;
  editingCategory: Category | null = null;

  categoryForm = {
    name: '',
    parentId: null as number | null,
    description: ''
  };

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading = true;
    this.api.get<Category[]>('/admin/categories').subscribe({
      next: (list) => {
        this.categories = list || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getParentName(parentId: number | null | undefined): string {
    if (!parentId) return '—';
    const parent = this.categories.find(c => c.id === parentId);
    return parent?.name ?? '—';
  }

  saveCategory() {
    if (!this.categoryForm.name.trim()) {
      this.toast.error('Le nom de la catégorie est obligatoire.');
      return;
    }
    this.saving = true;
    const body: any = {
      name: this.categoryForm.name.trim(),
      description: this.categoryForm.description?.trim() || undefined,
    };
    if (this.categoryForm.parentId) body.parentId = this.categoryForm.parentId;

    if (this.editingCategory) {
      this.api.patch<Category>(`/admin/categories/${this.editingCategory.id}`, body).subscribe({
        next: () => {
          this.loadCategories();
          this.cancelEdit();
          this.saving = false;
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Impossible de modifier la catégorie');
          this.saving = false;
        }
      });
    } else {
      this.api.post<Category>('/admin/categories', body).subscribe({
        next: () => {
          this.categoryForm = { name: '', parentId: null, description: '' };
          this.loadCategories();
          this.saving = false;
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Impossible de créer la catégorie');
          this.saving = false;
        }
      });
    }
  }

  editCategory(cat: Category) {
    this.editingCategory = cat;
    this.categoryForm = {
      name: cat.name,
      parentId: cat.parentId ?? null,
      description: cat.description ?? ''
    };
  }

  cancelEdit() {
    this.editingCategory = null;
    this.categoryForm = { name: '', parentId: null, description: '' };
  }

  toggleActive(cat: Category) {
    this.togglingId = cat.id;
    const newActive = cat.isActive !== false ? false : true;
    this.api.patch<Category>(`/admin/categories/${cat.id}`, { isActive: newActive }).subscribe({
      next: () => {
        this.loadCategories();
        this.togglingId = null;
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Impossible de modifier le statut');
        this.togglingId = null;
      }
    });
  }

  confirmDelete(cat: Category) {
    if (!confirm(`Supprimer la catégorie « ${cat.name } » ? Cette action est irréversible. Les catégories avec des produits ne peuvent pas être supprimées.`)) {
      return;
    }
    this.deletingId = cat.id;
    this.api.delete(`/admin/categories/${cat.id}`).subscribe({
      next: () => {
        this.loadCategories();
        this.deletingId = null;
        if (this.editingCategory?.id === cat.id) this.cancelEdit();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Impossible de supprimer');
        this.deletingId = null;
      }
    });
  }
}
