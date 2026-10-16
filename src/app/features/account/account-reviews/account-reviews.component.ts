import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { safeProductImageUrl } from '../../../shared/utils/placeholder-image';
import { formatDate } from '../../admin/shared/admin-format';
import { MyReview, ProductToReview } from '../shared/account.models';

type Tab = 'a-evaluer' | 'publies';

const RATING_LABELS = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent'];

@Component({
  selector: 'app-account-reviews',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="adm-page-head">
      <div>
        <h1>Mes avis</h1>
        <p>Partagez votre expérience : vos avis aident les autres clientes à bien choisir.</p>
      </div>
    </div>

    <div class="adm-card wrap">
      <div class="tabs" role="tablist">
        <button type="button" role="tab" [class.active]="tab() === 'a-evaluer'" [attr.aria-selected]="tab() === 'a-evaluer'" (click)="tab.set('a-evaluer')">
          <i class="fa-regular fa-star"></i> À évaluer <span class="n">{{ toReview().length }}</span>
        </button>
        <button type="button" role="tab" [class.active]="tab() === 'publies'" [attr.aria-selected]="tab() === 'publies'" (click)="tab.set('publies')">
          <i class="fa-regular fa-comment-dots"></i> Mes avis <span class="n">{{ reviews().length }}</span>
        </button>
      </div>

      @if (loading()) {
        @for (i of [1, 2, 3]; track i) { <div class="adm-skel sk-row"></div> }
      } @else if (error()) {
        <div class="adm-empty">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Impossible de charger vos avis.</p>
          <button type="button" class="adm-btn adm-btn-sm" (click)="load()">Réessayer</button>
        </div>
      } @else if (tab() === 'a-evaluer') {
        @if (toReview().length) {
          <ul class="to-review">
            @for (p of toReview(); track p.productId) {
              <li class="tr-item">
                <a [routerLink]="['/produit', p.slug]" class="tr-img"><img [src]="image(p.image)" [alt]="p.name" loading="lazy" /></a>
                <div class="tr-info">
                  <a [routerLink]="['/produit', p.slug]" class="tr-name">{{ p.name }}</a>
                  <small>Livré le {{ formatDate(p.deliveredAt) }}</small>
                  <div class="tr-stars" aria-hidden="true">
                    @for (s of stars; track s) { <i class="fa-regular fa-star"></i> }
                  </div>
                </div>
                <button type="button" class="adm-btn adm-btn-sm" (click)="open(p)"><i class="fa-solid fa-pen"></i> Donner mon avis</button>
              </li>
            }
          </ul>
        } @else {
          <div class="adm-empty">
            <i class="fa-regular fa-star"></i>
            <strong>Aucun produit à évaluer</strong>
            <p>Les produits de vos commandes livrées apparaîtront ici pour que vous puissiez les noter.</p>
            <a routerLink="/compte/commandes" class="adm-btn adm-btn-ghost adm-btn-sm">Voir mes commandes</a>
          </div>
        }
      } @else {
        @if (reviews().length) {
          <ul class="reviews">
            @for (r of reviews(); track r.id) {
              <li class="rv">
                <a [routerLink]="['/produit', r.product.slug]" class="tr-img"><img [src]="image(r.product.image)" [alt]="r.product.name" loading="lazy" /></a>
                <div class="rv-body">
                  <div class="rv-top">
                    <a [routerLink]="['/produit', r.product.slug]" class="tr-name">{{ r.product.name }}</a>
                    @if (r.isApproved) {
                      <span class="adm-badge green"><i class="fa-solid fa-circle-check"></i> Publié</span>
                    } @else {
                      <span class="adm-badge amber"><i class="fa-solid fa-hourglass-half"></i> En cours de validation</span>
                    }
                  </div>
                  <div class="rv-meta">
                    <span class="adm-stars" [attr.aria-label]="r.rating + ' sur 5'">
                      @for (s of stars; track s) { <i class="fa-solid fa-star" [class.off]="s > r.rating"></i> }
                    </span>
                    <small>{{ formatDate(r.createdAt) }}</small>
                  </div>
                  @if (r.title) { <p class="rv-title">{{ r.title }}</p> }
                  @if (r.comment) { <p class="rv-comment">{{ r.comment }}</p> }
                </div>
                <div class="rv-actions">
                  @if (confirmId() === r.id) {
                    <span class="confirm">Supprimer cet avis ?</span>
                    <button type="button" class="adm-btn adm-btn-danger adm-btn-xs" (click)="remove(r)" [disabled]="deleting()">Oui</button>
                    <button type="button" class="adm-btn adm-btn-ghost adm-btn-xs" (click)="confirmId.set(null)">Non</button>
                  } @else {
                    <button type="button" class="icon-btn" (click)="confirmId.set(r.id)" aria-label="Supprimer cet avis" title="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
                  }
                </div>
              </li>
            }
          </ul>
        } @else {
          <div class="adm-empty">
            <i class="fa-regular fa-comment-dots"></i>
            <strong>Vous n'avez pas encore publié d'avis</strong>
            <p>Notez les produits que vous avez reçus depuis l'onglet « À évaluer ».</p>
          </div>
        }
      }
    </div>

    <p class="note"><i class="fa-solid fa-circle-info"></i> Chaque avis est relu par notre équipe avant publication (sous 48 h en général). Les avis injurieux ou hors sujet ne sont pas publiés.</p>

    @if (current(); as p) {
      <div class="adm-overlay" (click)="close()"></div>
      <aside class="adm-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <div class="adm-drawer-head">
          <h2 id="drawer-title">Donner mon avis</h2>
          <button type="button" class="icon-btn" (click)="close()" aria-label="Fermer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form class="adm-drawer-body" id="review-form" (ngSubmit)="submit(p)">
          <div class="product">
            <img [src]="image(p.image)" alt="" />
            <strong>{{ p.name }}</strong>
          </div>

          <fieldset class="rating">
            <legend>Votre note <span class="req">*</span></legend>
            <div class="star-input" (mouseleave)="hover.set(0)">
              @for (s of stars; track s) {
                <button type="button" [class.on]="s <= (hover() || form.rating)" (mouseenter)="hover.set(s)" (click)="form.rating = s"
                  [attr.aria-label]="s + ' étoile' + (s > 1 ? 's' : '') + ' — ' + ratingLabels[s]" [attr.aria-pressed]="form.rating === s">
                  <i class="fa-solid fa-star"></i>
                </button>
              }
            </div>
            <small class="rating-label">{{ ratingLabels[hover() || form.rating] || 'Touchez une étoile pour noter' }}</small>
          </fieldset>

          <label class="field">
            <span>Titre <em>(facultatif)</em></span>
            <input class="adm-input" name="title" [(ngModel)]="form.title" maxlength="150" placeholder="Ex. Ma peau n'a jamais été aussi douce" />
          </label>

          <label class="field">
            <span>Votre avis <span class="req">*</span></span>
            <textarea class="adm-textarea" name="comment" rows="6" [(ngModel)]="form.comment" maxlength="2000"
              placeholder="Texture, parfum, efficacité, résultats… Racontez-nous !"></textarea>
            <small class="counter" [class.ok]="form.comment.trim().length >= 10">{{ form.comment.trim().length }} / 2000 — 10 caractères minimum</small>
          </label>

          @if (formError()) { <p class="alert" role="alert"><i class="fa-solid fa-circle-exclamation"></i> {{ formError() }}</p> }
        </form>
        <div class="adm-drawer-foot">
          <button type="button" class="adm-btn adm-btn-ghost" (click)="close()">Annuler</button>
          <button type="submit" form="review-form" class="adm-btn" [disabled]="saving() || !canSubmit()">
            @if (saving()) { <i class="fa-solid fa-spinner fa-spin"></i> Envoi… } @else { Publier mon avis }
          </button>
        </div>
      </aside>
    }
  `,
  styles: [`
    :host { display: block; }
    .wrap { padding: 8px 22px 20px; }
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--adm-line); margin-bottom: 6px; overflow-x: auto; }
    .tabs button { display: inline-flex; align-items: center; gap: 8px; padding: 14px 16px; background: none; font: inherit; font-size: .9rem; font-weight: 600; color: var(--adm-muted); border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; }
    .tabs button.active { color: var(--adm-ink); border-bottom-color: var(--adm-orange); }
    .tabs button.active i { color: var(--adm-orange); }
    .n { min-width: 22px; height: 22px; padding: 0 7px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: #f4efec; font-size: .74rem; }
    .active .n { background: var(--adm-orange-soft); color: var(--adm-orange-dark); }
    .to-review, .reviews { list-style: none; margin: 0; padding: 0; }
    .tr-item, .rv { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 16px 0; border-top: 1px solid var(--adm-line); }
    .tr-item:first-child, .rv:first-child { border-top: 0; }
    .rv { align-items: start; }
    .tr-img img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; background: #fbf6f2; display: block; }
    .tr-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .tr-name { font-weight: 600; color: var(--adm-ink); text-decoration: none; }
    .tr-name:hover { color: var(--adm-orange); }
    .tr-info small, .rv-meta small { font-size: .78rem; color: var(--adm-muted); }
    .tr-stars { color: #e6d9d0; font-size: .8rem; letter-spacing: 2px; }
    .rv-body { min-width: 0; }
    .rv-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .rv-meta { display: flex; align-items: center; gap: 10px; margin: 4px 0 6px; }
    .rv-title { margin: 0 0 2px; font-weight: 600; color: var(--adm-ink); font-size: .9rem; }
    .rv-comment { margin: 0; color: var(--adm-text); font-size: .86rem; line-height: 1.55; white-space: pre-line; word-break: break-word; }
    .rv-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
    .confirm { font-size: .8rem; color: var(--adm-text); }
    .icon-btn { width: 36px; height: 36px; border-radius: 10px; background: transparent; color: var(--adm-muted); display: inline-flex; align-items: center; justify-content: center; }
    .icon-btn:hover { background: #fdeceb; color: #c53b4b; }
    .adm-drawer-head .icon-btn:hover { background: #f4efec; color: var(--adm-ink); }
    .note { display: flex; gap: 10px; align-items: flex-start; margin: 16px 4px 0; font-size: .8rem; color: var(--adm-muted); }
    .note i { color: var(--adm-orange); margin-top: 2px; }
    .product { display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 12px; background: var(--adm-orange-50); margin-bottom: 22px; }
    .product img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; }
    .rating { border: 0; padding: 0; margin: 0 0 22px; }
    .rating legend, .field > span { font-size: .8rem; font-weight: 600; color: var(--adm-text); margin-bottom: 8px; padding: 0; }
    .field em { font-weight: 400; color: var(--adm-muted); }
    .req { color: var(--adm-orange); }
    .star-input { display: flex; gap: 6px; }
    .star-input button { background: none; padding: 2px; font-size: 1.9rem; color: #eae3df; transition: transform .15s, color .15s; line-height: 1; }
    .star-input button.on { color: #f2b33d; }
    .star-input button:hover { transform: scale(1.12); }
    .rating-label { display: block; margin-top: 6px; font-size: .82rem; color: var(--adm-muted); min-height: 1.2em; }
    .field { display: flex; flex-direction: column; margin-bottom: 18px; }
    .counter { margin-top: 6px; font-size: .74rem; color: var(--adm-muted); text-align: right; }
    .counter.ok { color: #2b8a52; }
    .alert { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; font-size: .86rem; color: #8c1d18; background: #fdeceb; border: 1px solid #f6c9c6; }
    .sk-row { height: 72px; border-radius: 12px; margin: 14px 0; }
    @media (max-width: 640px) {
      .wrap { padding: 4px 14px 14px; }
      .tr-item, .rv { grid-template-columns: 52px minmax(0, 1fr); gap: 12px; }
      .tr-img img { width: 52px; height: 52px; }
      .tr-item > .adm-btn, .rv-actions { grid-column: 1 / -1; }
      .tr-item > .adm-btn { width: 100%; }
    }
  `],
})
export class AccountReviewsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly stars = [1, 2, 3, 4, 5];
  readonly ratingLabels = RATING_LABELS;
  readonly reviews = signal<MyReview[]>([]);
  readonly toReview = signal<ProductToReview[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly tab = signal<Tab>('a-evaluer');
  readonly current = signal<ProductToReview | null>(null);
  readonly hover = signal(0);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly confirmId = signal<number | null>(null);
  readonly deleting = signal(false);

  form = { rating: 0, title: '', comment: '' };

  readonly formatDate = formatDate;
  readonly image = safeProductImageUrl;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.current()) this.close();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.get<{ reviews: MyReview[]; toReview: ProductToReview[] }>('/account/reviews').subscribe({
      next: (res) => {
        this.reviews.set(res?.reviews ?? []);
        this.toReview.set(res?.toReview ?? []);
        if (!this.toReview().length && this.reviews().length) this.tab.set('publies');
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  canSubmit(): boolean {
    return this.form.rating >= 1 && this.form.comment.trim().length >= 10;
  }

  open(p: ProductToReview): void {
    this.form = { rating: 0, title: '', comment: '' };
    this.formError.set('');
    this.hover.set(0);
    this.current.set(p);
  }

  close(): void {
    if (this.saving()) return;
    this.current.set(null);
  }

  submit(p: ProductToReview): void {
    this.formError.set('');
    if (this.form.rating < 1) {
      this.formError.set('Choisissez une note entre 1 et 5 étoiles.');
      return;
    }
    if (this.form.comment.trim().length < 10) {
      this.formError.set('Votre avis doit contenir au moins 10 caractères.');
      return;
    }
    this.saving.set(true);
    this.api.post<{ id: number; createdAt: string; isApproved: boolean }>('/account/reviews', {
      productId: p.productId,
      rating: this.form.rating,
      title: this.form.title.trim(),
      comment: this.form.comment.trim(),
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.reviews.update((list) => [{
          id: res.id,
          rating: this.form.rating,
          title: this.form.title.trim() || null,
          comment: this.form.comment.trim(),
          isApproved: res.isApproved,
          createdAt: res.createdAt,
          product: { id: p.productId, name: p.name, slug: p.slug, image: p.image },
        }, ...list]);
        this.toReview.update((list) => list.filter((x) => x.productId !== p.productId));
        this.current.set(null);
        this.toast.success('Merci ! Votre avis sera publié après validation.');
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'Impossible d’envoyer votre avis. Réessayez.');
      },
    });
  }

  remove(r: MyReview): void {
    if (this.deleting()) return;
    this.deleting.set(true);
    this.api.delete(`/account/reviews/${r.id}`).subscribe({
      next: () => {
        this.deleting.set(false);
        this.confirmId.set(null);
        this.reviews.update((list) => list.filter((x) => x.id !== r.id));
        this.toast.success('Votre avis a été supprimé.');
        this.load();
      },
      error: (err) => {
        this.deleting.set(false);
        this.toast.error(err?.error?.message ?? 'Impossible de supprimer cet avis.');
      },
    });
  }
}
