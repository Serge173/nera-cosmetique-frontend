import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminSummaryService } from '../shared/admin-summary.service';
import { formatDateTime, initials } from '../shared/admin-format';

interface Review {
  id: number;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { id: number; name: string; image: string | null };
  author: { name: string; email: string };
}

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="adm-page-head">
      <div>
        <h1>Avis & Notations</h1>
        <p>Modérez les avis laissés par vos clients avant leur publication sur la boutique.</p>
      </div>
    </header>

    <div class="top">
      <section class="adm-card score">
        <div class="score-main">
          <strong>{{ averageText() }}</strong>
          <span class="adm-stars big">
            @for (s of stars; track s) { <i class="fa-solid fa-star" [class.off]="s > roundedAverage()"></i> }
          </span>
          <small>{{ reviews().length }} avis au total</small>
        </div>
        <ul class="bars">
          @for (r of distribution(); track r.rating) {
            <li>
              <span>{{ r.rating }} <i class="fa-solid fa-star"></i></span>
              <div class="bar"><i [style.width.%]="r.percent"></i></div>
              <em>{{ r.count }}</em>
            </li>
          }
        </ul>
      </section>
      <div class="mini">
        <div class="adm-card adm-stat">
          <span class="adm-stat-icon amber"><i class="fa-solid fa-hourglass-half"></i></span>
          <div><div class="adm-stat-label">En attente</div><div class="adm-stat-value">{{ pendingCount() }}</div></div>
        </div>
        <div class="adm-card adm-stat">
          <span class="adm-stat-icon green"><i class="fa-solid fa-circle-check"></i></span>
          <div><div class="adm-stat-label">Publiés</div><div class="adm-stat-value">{{ reviews().length - pendingCount() }}</div></div>
        </div>
      </div>
    </div>

    <section class="adm-card">
      <div class="adm-toolbar">
        <div class="adm-chips">
          <button type="button" class="adm-chip" [class.active]="filter() === 'all'" (click)="filter.set('all')">Tous <span class="count">{{ reviews().length }}</span></button>
          <button type="button" class="adm-chip" [class.active]="filter() === 'pending'" (click)="filter.set('pending')">En attente <span class="count">{{ pendingCount() }}</span></button>
          <button type="button" class="adm-chip" [class.active]="filter() === 'approved'" (click)="filter.set('approved')">Publiés <span class="count">{{ reviews().length - pendingCount() }}</span></button>
        </div>
        <label class="adm-search grow">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input class="adm-input" type="search" [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Produit, client, contenu..." aria-label="Rechercher un avis" />
        </label>
        <select class="adm-select rating" [ngModel]="rating()" (ngModelChange)="rating.set(+$event)" aria-label="Filtrer par note">
          <option [ngValue]="0">Toutes les notes</option>
          @for (s of [5, 4, 3, 2, 1]; track s) { <option [ngValue]="s">{{ s }} étoile{{ s > 1 ? 's' : '' }}</option> }
        </select>
      </div>

      @if (loading()) {
        <div class="list">
          @for (i of [1, 2, 3]; track i) { <div class="adm-skel" style="height: 110px"></div> }
        </div>
      } @else {
        <div class="list">
          @for (r of filtered(); track r.id) {
            <article class="review" [class.pending]="!r.isApproved">
              <div class="rv-product">
                @if (r.product.image) {
                  <img class="adm-thumb" [src]="r.product.image" alt="" loading="lazy" />
                } @else {
                  <span class="adm-thumb"><i class="fa-solid fa-bottle-droplet"></i></span>
                }
                <div>
                  <strong>{{ r.product.name }}</strong>
                  <span class="adm-stars">
                    @for (s of stars; track s) { <i class="fa-solid fa-star" [class.off]="s > r.rating"></i> }
                  </span>
                </div>
              </div>
              <div class="rv-body">
                @if (r.title) { <h3>{{ r.title }}</h3> }
                <p>{{ r.comment || 'Aucun commentaire.' }}</p>
                <div class="rv-meta">
                  <span class="adm-avatar sm">{{ initialsOf(r.author.name) }}</span>
                  <span>{{ r.author.name || r.author.email }}</span>
                  <span class="sep">•</span>
                  <span>{{ formatDateTime(r.createdAt) }}</span>
                </div>
              </div>
              <div class="rv-actions">
                <span class="adm-badge dot" [class.amber]="!r.isApproved" [class.green]="r.isApproved">{{ r.isApproved ? 'Publié' : 'En attente' }}</span>
                <div class="btns">
                  @if (!r.isApproved) {
                    <button type="button" class="adm-btn adm-btn-sm" (click)="setApproval(r, true)" [disabled]="busyId() === r.id"><i class="fa-solid fa-check"></i> Approuver</button>
                  } @else {
                    <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" (click)="setApproval(r, false)" [disabled]="busyId() === r.id"><i class="fa-regular fa-eye-slash"></i> Masquer</button>
                  }
                  <button type="button" class="adm-icon-btn sm danger" (click)="remove(r)" [disabled]="busyId() === r.id" aria-label="Supprimer l'avis"><i class="fa-regular fa-trash-can"></i></button>
                </div>
              </div>
            </article>
          } @empty {
            <div class="adm-empty">
              <i class="fa-regular fa-star"></i>
              <strong>{{ reviews().length ? 'Aucun avis ne correspond à vos filtres' : 'Aucun avis pour le moment' }}</strong>
              {{ reviews().length ? '' : 'Les avis de vos clients apparaîtront ici pour modération.' }}
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .top { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 16px; margin-bottom: 20px; }
    .score { display: flex; align-items: center; gap: 32px; padding: 22px 26px; }
    .score-main { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 130px; }
    .score-main strong { font-size: 2.6rem; font-weight: 700; color: var(--adm-ink); line-height: 1; }
    .score-main small { color: var(--adm-muted); font-size: .78rem; }
    .adm-stars.big { font-size: 1rem; }
    .bars { list-style: none; margin: 0; padding: 0; flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .bars li { display: grid; grid-template-columns: 38px 1fr 30px; align-items: center; gap: 10px; font-size: .8rem; color: var(--adm-text); }
    .bars li span i { color: #f2b33d; font-size: .7rem; }
    .bar { height: 8px; background: #f5f0ed; border-radius: 99px; overflow: hidden; }
    .bar i { display: block; height: 100%; background: linear-gradient(90deg, #fabf97, var(--adm-orange)); border-radius: 99px; transition: width .4s ease; }
    .bars em { font-style: normal; color: var(--adm-muted); text-align: right; }
    .mini { display: grid; gap: 16px; }
    .grow { flex: 1 1 220px; }
    .rating { width: 180px; }
    .list { padding: 18px 22px 22px; display: flex; flex-direction: column; gap: 14px; }
    .review {
      display: grid; grid-template-columns: 240px minmax(0, 1fr) auto; gap: 20px; align-items: start;
      padding: 18px; border: 1px solid var(--adm-line); border-radius: 14px; background: #fff; transition: border-color .2s, box-shadow .2s;
    }
    .review:hover { border-color: #f5decf; box-shadow: 0 8px 22px rgba(42, 37, 33, .05); }
    .review.pending { background: linear-gradient(90deg, #fffaf0, #fff 40%); border-color: #f7e6c4; }
    .rv-product { display: flex; gap: 12px; align-items: center; min-width: 0; }
    .rv-product strong { display: block; font-size: .85rem; color: var(--adm-ink); margin-bottom: 4px; }
    .rv-body h3 { font-size: .92rem; margin: 0 0 4px; }
    .rv-body p { margin: 0; font-size: .86rem; color: var(--adm-text); line-height: 1.55; white-space: pre-line; word-break: break-word; }
    .rv-meta { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: .76rem; color: var(--adm-muted); flex-wrap: wrap; }
    .adm-avatar.sm { width: 26px; height: 26px; font-size: .62rem; }
    .rv-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
    .btns { display: flex; gap: 8px; }
    @media (max-width: 1100px) {
      .top { grid-template-columns: 1fr; }
      .mini { grid-template-columns: 1fr 1fr; }
      .review { grid-template-columns: 1fr; gap: 12px; }
      .rv-actions { flex-direction: row; justify-content: space-between; align-items: center; }
    }
    @media (max-width: 640px) {
      .score { flex-direction: column; gap: 18px; padding: 18px; }
      .bars { width: 100%; }
      .rating { width: 100%; }
      .list { padding: 14px; }
    }
  `],
})
export class AdminReviewsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private summary = inject(AdminSummaryService);

  readonly stars = [1, 2, 3, 4, 5];
  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal<number | null>(null);
  readonly filter = signal<'all' | 'pending' | 'approved'>('all');
  readonly search = signal('');
  readonly rating = signal(0);

  readonly pendingCount = computed(() => this.reviews().filter((r) => !r.isApproved).length);
  readonly average = computed(() => {
    const list = this.reviews();
    return list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : 0;
  });
  readonly roundedAverage = computed(() => Math.round(this.average()));
  readonly averageText = computed(() =>
    this.average().toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  );
  readonly distribution = computed(() => {
    const list = this.reviews();
    return [5, 4, 3, 2, 1].map((rating) => {
      const count = list.filter((r) => r.rating === rating).length;
      return { rating, count, percent: list.length ? (count / list.length) * 100 : 0 };
    });
  });
  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.reviews().filter((r) => {
      if (this.filter() === 'pending' && r.isApproved) return false;
      if (this.filter() === 'approved' && !r.isApproved) return false;
      if (this.rating() && r.rating !== this.rating()) return false;
      if (!q) return true;
      return `${r.product.name} ${r.author.name} ${r.author.email} ${r.title ?? ''} ${r.comment ?? ''}`.toLowerCase().includes(q);
    });
  });

  readonly formatDateTime = formatDateTime;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<Review[]>('/admin/reviews').subscribe({
      next: (list) => {
        this.reviews.set(list ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Impossible de charger les avis.');
      },
    });
  }

  initialsOf(name: string): string {
    return initials(name);
  }

  setApproval(r: Review, isApproved: boolean): void {
    this.busyId.set(r.id);
    this.api.patch(`/admin/reviews/${r.id}`, { isApproved }).subscribe({
      next: () => {
        this.reviews.update((list) => list.map((x) => (x.id === r.id ? { ...x, isApproved } : x)));
        this.busyId.set(null);
        this.summary.refresh();
        this.toast.success(isApproved ? 'Avis publié.' : 'Avis masqué.');
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(err?.error?.message || 'Action impossible.');
      },
    });
  }

  remove(r: Review): void {
    if (!confirm('Supprimer définitivement cet avis ?')) return;
    this.busyId.set(r.id);
    this.api.delete(`/admin/reviews/${r.id}`).subscribe({
      next: () => {
        this.reviews.update((list) => list.filter((x) => x.id !== r.id));
        this.busyId.set(null);
        this.summary.refresh();
        this.toast.success('Avis supprimé.');
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(err?.error?.message || 'Suppression impossible.');
      },
    });
  }
}
