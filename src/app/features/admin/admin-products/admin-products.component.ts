import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product, ProductListResponse } from '../../../models/product.model';
import { Category } from '../../../models/product.model';
import { Brand } from '../../../models/product.model';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { safeThumbImageUrl } from '../../../shared/utils/placeholder-image';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PricePipe],
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
          <div class="admin-header">
            <h1>Gestion des produits</h1>
            <button type="button" class="btn btn-primary" (click)="showForm = true">+ Ajouter un produit</button>
          </div>

        @if (showForm) {
          <div class="form-panel">
            <h2>{{ editingProduct ? 'Modifier le produit' : 'Nouveau produit' }}</h2>
            <form (ngSubmit)="saveProduct()">
              <div class="form-row">
                <div class="form-group">
                  <label>Nom *</label>
                  <input type="text" [(ngModel)]="form.name" name="name" required />
                </div>
                <div class="form-group">
                  <label>Prix (FCFA) *</label>
                  <input type="number" [(ngModel)]="form.price" name="price" required min="0" />
                </div>
              </div>
              <div class="form-group">
                <label>Description courte</label>
                <input type="text" [(ngModel)]="form.shortDescription" name="shortDescription" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="form.description" name="description" rows="3"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Catégorie *</label>
                  <select [(ngModel)]="form.categoryId" name="categoryId" required>
                    <option value="">-- Choisir --</option>
                    @for (c of categories; track c.id) {
                      <option [value]="c.id">{{ c.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label>Marque</label>
                  <select [(ngModel)]="form.brandId" name="brandId">
                    <option [value]="null">-- Aucune --</option>
                    @for (b of brands; track b.id) {
                      <option [value]="b.id">{{ b.name }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Stock *</label>
                  <input type="number" [(ngModel)]="form.stockQuantity" name="stockQuantity" min="0" />
                </div>
                <div class="form-group">
                  <label>Type de peau</label>
                  <input type="text" [(ngModel)]="form.skinType" name="skinType" placeholder="Tous types, Mixte, Sèche..." />
                </div>
              </div>
              <div class="form-group">
                <label>Image du produit</label>
                <p class="form-hint">Saisir une URL <strong>ou</strong> envoyer un fichier (les deux méthodes sont possibles).</p>
                <input type="url" [(ngModel)]="form.imageUrl" name="imageUrl" placeholder="https://... (URL de l'image)" class="full-width" />
                <div class="upload-row">
                  <label class="upload-label">
                    <span class="btn btn-secondary btn-small">{{ uploadingImage ? 'Envoi...' : 'Choisir un fichier' }}</span>
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" (change)="onImageFileSelected($event)" [disabled]="uploadingImage" class="hidden-input" />
                  </label>
                  @if (form.imageUrl) {
                    <span class="image-preview-text">Image définie</span>
                  }
                </div>
              </div>
              <div class="form-group checkbox-group">
                <label><input type="checkbox" [(ngModel)]="form.isFeatured" name="isFeatured" /> En vedette</label>
                <label><input type="checkbox" [(ngModel)]="form.isNew" name="isNew" /> Nouveauté</label>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" [disabled]="saving">{{ saving ? 'Enregistrement...' : 'Enregistrer' }}</button>
                <button type="button" class="btn btn-secondary" (click)="cancelForm()">Annuler</button>
              </div>
            </form>
          </div>
        }

        <div class="products-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Nom</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Catégorie</th>
                <th>Vedette</th>
                <th>Nouveau</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading) {
                <tr><td colspan="8">Chargement...</td></tr>
              } @else if (products.length === 0) {
                <tr><td colspan="8">Aucun produit. Cliquez sur "Ajouter un produit".</td></tr>
              } @else {
                @for (p of products; track p.id) {
                  <tr>
                    <td>
                      <img [src]="getProductImage(p)" [alt]="p.name" class="thumb" />
                    </td>
                    <td>{{ p.name }}</td>
                    <td>{{ p.price | price }}</td>
                    <td>{{ p.stockQuantity }}</td>
                    <td>{{ getCategoryName(p) }}</td>
                    <td>{{ p.isFeatured ? 'Oui' : '-' }}</td>
                    <td>{{ p.isNew ? 'Oui' : '-' }}</td>
                    <td class="actions">
                      <button type="button" class="btn btn-small btn-secondary" (click)="editProduct(p)">Modifier</button>
                      <button type="button" class="btn btn-small btn-danger" (click)="deleteProduct(p.id)">Supprimer</button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
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
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .form-panel {
      background: white;
      padding: 24px;
      border-radius: 8px;
      margin-bottom: 24px;
      box-shadow: var(--shadow);
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }
    .form-hint {
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
    }
    .upload-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }
    .upload-label {
      cursor: pointer;
      margin: 0;
    }
    .hidden-input {
      position: absolute;
      width: 0;
      height: 0;
      opacity: 0;
    }
    .image-preview-text {
      font-size: 13px;
      color: var(--primary-color);
    }
    .checkbox-group label {
      display: inline-block;
      margin-right: 16px;
    }
    .checkbox-group input {
      width: auto;
      margin-right: 6px;
    }
    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }
    .products-table {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: var(--shadow);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    th {
      background: var(--secondary-color);
      font-weight: 600;
    }
    .thumb {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 4px;
    }
    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn-small {
      padding: 6px 12px;
      font-size: 13px;
    }
    .btn-danger {
      background: #c62828;
      color: white;
      border: none;
    }
    .btn-danger:hover {
      background: #b71c1c;
    }
    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  brands: Brand[] = [];
  loading = false;
  saving = false;
  uploadingImage = false;
  showForm = false;
  editingProduct: Product | null = null;

  form = {
    name: '',
    shortDescription: '',
    description: '',
    price: 0,
    categoryId: null as number | null,
    brandId: null as number | null,
    stockQuantity: 0,
    skinType: '',
    imageUrl: '',
    isFeatured: false,
    isNew: false
  };

  constructor(private api: ApiService, private authService: AuthService, private toast: ToastService) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
    this.loadBrands();
  }

  loadProducts() {
    this.loading = true;
    this.api.get<ProductListResponse>('/admin/products').subscribe({
      next: (res) => {
        this.products = res.products || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadCategories() {
    this.api.get<Category[]>('/categories').subscribe(cats => this.categories = cats || []);
  }

  loadBrands() {
    this.api.get<Brand[]>('/brands').subscribe(b => this.brands = b || []);
  }

  onImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const token = this.authService.getToken();
    if (!token) {
      this.toast.error('Vous devez être connecté pour envoyer une image. Reconnectez-vous.');
      return;
    }
    this.uploadingImage = true;
    this.api.uploadImage(file, token).subscribe({
      next: (res) => {
        this.form.imageUrl = res.url;
        this.uploadingImage = false;
        input.value = '';
      },
      error: (err) => {
        this.toast.error('Erreur lors de l\'envoi de l\'image : ' + (err?.error?.message || err?.message || 'échec'));
        this.uploadingImage = false;
      }
    });
  }

  getProductImage(p: Product): string {
    const img = p.images?.find(i => i.isPrimary) || p.images?.[0];
    return safeThumbImageUrl(img?.url);
  }

  getCategoryName(p: Product): string {
    if (p.category?.name) return p.category.name;
    const cat = this.categories.find(c => c.id === p.categoryId);
    return cat?.name ?? '-';
  }

  private truncate(s: string | null | undefined, max: number): string {
    if (s == null || typeof s !== 'string') return '';
    const t = s.trim();
    return t.length <= max ? t : t.slice(0, max);
  }

  saveProduct() {
    const name = this.truncate(this.form.name, 255);
    if (!name) {
      this.toast.error('Le nom du produit est obligatoire.');
      return;
    }
    const categoryId = Number(this.form.categoryId);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      this.toast.error('Veuillez choisir une catégorie.');
      return;
    }
    const price = Number(this.form.price);
    if (Number.isNaN(price) || price < 0) {
      this.toast.error('Le prix doit être un nombre positif ou nul.');
      return;
    }
    const stockQuantity = Math.max(0, Math.floor(Number(this.form.stockQuantity) || 0));

    this.saving = true;
    const body = {
      name,
      shortDescription: this.truncate(this.form.shortDescription, 500) || undefined,
      description: this.truncate(this.form.description, 65535) || undefined,
      price,
      categoryId,
      brandId: this.form.brandId ? Number(this.form.brandId) : undefined,
      stockQuantity,
      skinType: this.truncate(this.form.skinType, 120) || undefined,
      imageUrl: this.truncate(this.form.imageUrl, 500) || undefined,
      isFeatured: !!this.form.isFeatured,
      isNew: !!this.form.isNew
    };
    const id = this.editingProduct?.id;
    const req = id
      ? this.api.patch<Product>(`/admin/products/${id}`, body)
      : this.api.post<Product>('/admin/products', body);
    req.subscribe({
      next: () => {
        this.loadProducts();
        this.cancelForm();
        this.toast.success(id ? 'Produit mis à jour.' : 'Produit enregistré.');
        this.saving = false;
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'impossible d\'enregistrer le produit';
        this.toast.error('Erreur : ' + msg);
        this.saving = false;
      }
    });
  }

  editProduct(p: Product) {
    this.editingProduct = p;
    this.form = {
      name: p.name,
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      price: p.price,
      categoryId: p.categoryId ?? null,
      brandId: p.brandId ?? null,
      stockQuantity: p.stockQuantity ?? 0,
      skinType: p.skinType || '',
      imageUrl: p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url || '',
      isFeatured: !!p.isFeatured,
      isNew: !!p.isNew
    };
    this.showForm = true;
  }

  deleteProduct(id: number) {
    if (!confirm('Supprimer ce produit ? (il sera désactivé)')) return;
    this.api.delete(`/admin/products/${id}`).subscribe({
      next: () => this.loadProducts(),
      error: (err) => this.toast.error(err?.error?.message || 'Impossible de supprimer le produit')
    });
  }

  cancelForm() {
    this.showForm = false;
    this.editingProduct = null;
    this.form = {
      name: '',
      shortDescription: '',
      description: '',
      price: 0,
      categoryId: null,
      brandId: null,
      stockQuantity: 0,
      skinType: '',
      imageUrl: '',
      isFeatured: false,
      isNew: false
    };
  }

}
