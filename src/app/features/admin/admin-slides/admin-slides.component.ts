import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';

interface AdminSlide {
  id: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  link?: string | null;
  linkLabel?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-admin-slides',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="admin-main legacy-page">
          <h1>Gestion des slides d'accueil</h1>

          <div class="form-panel">
            <h2>{{ editingSlide ? 'Modifier le slide' : 'Nouveau slide' }}</h2>
            <form (ngSubmit)="saveSlide()">
              <div class="form-row">
                <div class="form-group">
                  <label>Titre *</label>
                  <input type="text" [(ngModel)]="form.title" name="title" required />
                </div>
                <div class="form-group">
                  <label>Ordre d'affichage</label>
                  <input type="number" [(ngModel)]="form.sortOrder" name="sortOrder" />
                </div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="form.description" name="description" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label>URL de l'image</label>
                <input type="url" [(ngModel)]="form.imageUrl" name="imageUrl" placeholder="https://..." />
                <div class="upload-row">
                  <label class="upload-label">
                    <span class="btn btn-secondary btn-small">{{ uploadingImage ? 'Envoi...' : 'Téléverser une image' }}</span>
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" (change)="onImageFileSelected($event)" [disabled]="uploadingImage" class="hidden-input" />
                  </label>
                  @if (form.imageUrl) {
                    <span class="image-preview-text">Image définie</span>
                  }
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Lien (optionnel)</label>
                  <input type="text" [(ngModel)]="form.link" name="link" placeholder="/boutique, /contact, ..." />
                </div>
                <div class="form-group">
                  <label>Texte du bouton</label>
                  <input type="text" [(ngModel)]="form.linkLabel" name="linkLabel" placeholder="Découvrir, Commander..." />
                </div>
              </div>
              <div class="form-group checkbox-group">
                <label>
                  <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
                  Slide actif (visible sur la page d'accueil)
                </label>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" [disabled]="saving">
                  {{ saving ? 'Enregistrement...' : (editingSlide ? 'Enregistrer' : 'Créer le slide') }}
                </button>
                @if (editingSlide) {
                  <button type="button" class="btn btn-secondary" (click)="cancelEdit()">Annuler</button>
                }
              </div>
            </form>
          </div>

          <div class="slides-panel">
            <h2>Slides existants</h2>
            @if (loading) {
              <p>Chargement...</p>
            } @else if (slides.length === 0) {
              <p>Aucun slide. Créez-en un ci-dessus.</p>
            } @else {
              <table class="slides-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Titre</th>
                    <th>Ordre</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of slides; track s.id) {
                    <tr [class.inactive]="!s.isActive">
                      <td>
                        @if (s.imageUrl) {
                          <img [src]="s.imageUrl" alt="" class="slide-thumb" />
                        } @else {
                          —
                        }
                      </td>
                      <td>
                        <div class="slide-title">{{ s.title }}</div>
                        @if (s.description) {
                          <div class="slide-desc">{{ s.description }}</div>
                        }
                      </td>
                      <td>{{ s.sortOrder }}</td>
                      <td>
                        @if (s.isActive) {
                          <span class="badge badge-active">Actif</span>
                        } @else {
                          <span class="badge badge-inactive">Suspendu</span>
                        }
                      </td>
                      <td class="actions">
                        <button type="button" class="btn btn-small btn-secondary" (click)="editSlide(s)">Modifier</button>
                        <button
                          type="button"
                          class="btn btn-small"
                          [class.btn-warning]="s.isActive"
                          [class.btn-success]="!s.isActive"
                          (click)="toggleActive(s)"
                          [disabled]="saving">
                          {{ s.isActive ? 'Suspendre' : 'Activer' }}
                        </button>
                        <button
                          type="button"
                          class="btn btn-small btn-danger"
                          (click)="confirmDelete(s)"
                          [disabled]="saving">
                          Supprimer
                        </button>
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
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }
    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }
    .form-actions { display: flex; gap: 12px; margin-top: 20px; }
    .upload-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }
    .upload-label {
      position: relative;
      overflow: hidden;
      cursor: pointer;
      margin: 0;
    }
    .upload-label .hidden-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }
    .image-preview-text {
      font-size: 13px;
      color: var(--primary-color);
    }
    .slides-panel {
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .slides-panel h2 { margin-bottom: 16px; }
    .slides-table { width: 100%; border-collapse: collapse; }
    .slides-table th, .slides-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }
    .slides-table th { background: var(--secondary-color); font-weight: 600; }
    .slide-thumb {
      width: 72px;
      height: 48px;
      object-fit: cover;
      border-radius: 6px;
    }
    .slide-title { font-weight: 600; }
    .slide-desc {
      font-size: 0.85rem;
      color: var(--text-light);
      margin-top: 4px;
      max-width: 320px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-active {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .badge-inactive {
      background: #ffebee;
      color: #c62828;
    }
    .actions { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn-small { padding: 6px 10px; font-size: 13px; }
    .btn-danger { background: #c62828; color: white; border: none; }
    .btn-danger:hover:not(:disabled) { background: #b71c1c; }
    .btn-warning { background: #ffb300; color: #222; border: none; }
    .btn-success { background: #2e7d32; color: white; border: none; }
    tr.inactive {
      opacity: 0.7;
    }
    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminSlidesComponent implements OnInit {
  slides: AdminSlide[] = [];
  loading = false;
  saving = false;
  uploadingImage = false;
  editingSlide: AdminSlide | null = null;

  form = {
    title: '',
    description: '',
    imageUrl: '',
    link: '',
    linkLabel: '',
    sortOrder: 0,
    isActive: true,
  };

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadSlides();
  }

  loadSlides(): void {
    this.loading = true;
    this.api.get<AdminSlide[]>('/admin/slides').subscribe({
      next: (list) => {
        this.slides = list || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Impossible de charger les slides.');
      }
    });
  }

  saveSlide(): void {
    if (!this.form.title.trim()) {
      this.toast.error('Le titre du slide est obligatoire.');
      return;
    }
    this.saving = true;
    const body: any = {
      title: this.form.title.trim(),
      description: this.form.description?.trim() || undefined,
      imageUrl: this.form.imageUrl?.trim() || undefined,
      link: this.form.link?.trim() || undefined,
      linkLabel: this.form.linkLabel?.trim() || undefined,
      sortOrder: Number(this.form.sortOrder) || 0,
      isActive: !!this.form.isActive,
    };
    if (this.editingSlide) {
      this.api.patch<AdminSlide>(`/admin/slides/${this.editingSlide.id}`, body).subscribe({
        next: () => {
          this.toast.success('Slide mis à jour.');
          this.saving = false;
          this.cancelEdit();
          this.loadSlides();
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.message || 'Impossible de modifier le slide.');
        }
      });
    } else {
      this.api.post<AdminSlide>('/admin/slides', body).subscribe({
        next: () => {
          this.toast.success('Slide créé.');
          this.saving = false;
          this.form = { title: '', description: '', imageUrl: '', link: '', linkLabel: '', sortOrder: 0, isActive: true };
          this.loadSlides();
        },
        error: (err) => {
          this.saving = false;
          this.toast.error(err?.error?.message || 'Impossible de créer le slide.');
        }
      });
    }
  }

  editSlide(s: AdminSlide): void {
    this.editingSlide = s;
    this.form = {
      title: s.title,
      description: s.description ?? '',
      imageUrl: s.imageUrl ?? '',
      link: s.link ?? '',
      linkLabel: s.linkLabel ?? '',
      sortOrder: s.sortOrder ?? 0,
      isActive: s.isActive,
    };
  }

  cancelEdit(): void {
    this.editingSlide = null;
    this.form = { title: '', description: '', imageUrl: '', link: '', linkLabel: '', sortOrder: 0, isActive: true };
  }

  toggleActive(s: AdminSlide): void {
    this.saving = true;
    this.api.patch<AdminSlide>(`/admin/slides/${s.id}`, { isActive: !s.isActive }).subscribe({
      next: (updated) => {
        s.isActive = updated.isActive;
        this.saving = false;
        this.toast.info(updated.isActive ? 'Slide activé.' : 'Slide suspendu.');
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.message || 'Impossible de modifier le statut du slide.');
      }
    });
  }

  confirmDelete(s: AdminSlide): void {
    if (!confirm(`Supprimer le slide « ${s.title} » ?`)) {
      return;
    }
    this.saving = true;
    this.api.delete(`/admin/slides/${s.id}`).subscribe({
      next: () => {
        this.toast.success('Slide supprimé.');
        this.saving = false;
        if (this.editingSlide?.id === s.id) {
          this.cancelEdit();
        }
        this.loadSlides();
      },
      error: (err) => {
        this.saving = false;
        this.toast.error(err?.error?.message || 'Impossible de supprimer le slide.');
      }
    });
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const token = this.auth.getToken();
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
        this.uploadingImage = false;
        this.toast.error('Erreur lors de l\'envoi de l\'image : ' + (err?.error?.message || err?.message || 'échec'));
      }
    });
  }
}

