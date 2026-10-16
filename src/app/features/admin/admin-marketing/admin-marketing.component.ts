import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminSummaryService } from '../shared/admin-summary.service';
import { downloadCsv, formatDate } from '../shared/admin-format';

interface Subscriber { id: number; email: string; isActive: boolean; createdAt: string; }

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin-marketing',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="adm-page-head">
      <div>
        <h1>Marketing</h1>
        <p>Animez votre boutique : newsletter, mises en avant et codes promotionnels.</p>
      </div>
    </header>

    <div class="tools">
      <a routerLink="/admin/slides" class="adm-card tool">
        <span class="tool-icon"><i class="fa-regular fa-images"></i></span>
        <strong>Slides d'accueil</strong>
        <small>{{ slidesActive() }} slide(s) actif(s) sur la page d'accueil</small>
        <span class="adm-link">Gérer <i class="fa-solid fa-arrow-right"></i></span>
      </a>
      <a routerLink="/admin/promotions" class="adm-card tool">
        <span class="tool-icon"><i class="fa-solid fa-ticket"></i></span>
        <strong>Codes promo</strong>
        <small>{{ couponsActive() }} code(s) actif(s)</small>
        <span class="adm-link">Gérer <i class="fa-solid fa-arrow-right"></i></span>
      </a>
      <a routerLink="/admin/products" class="adm-card tool">
        <span class="tool-icon"><i class="fa-solid fa-star"></i></span>
        <strong>Produits vedettes</strong>
        <small>Mettez en avant vos best-sellers et nouveautés</small>
        <span class="adm-link">Gérer <i class="fa-solid fa-arrow-right"></i></span>
      </a>
      <a routerLink="/admin/messages" class="adm-card tool">
        <span class="tool-icon"><i class="fa-regular fa-envelope"></i></span>
        <strong>Messages clients</strong>
        <small>{{ summary().unreadMessages }} message(s) non lu(s)</small>
        <span class="adm-link">Ouvrir <i class="fa-solid fa-arrow-right"></i></span>
      </a>
    </div>

    <section class="adm-card">
      <div class="adm-card-head">
        <div>
          <h2>Abonnés à la newsletter</h2>
          <div class="adm-sub">{{ activeCount() }} abonné(s) actif(s) — inscrits depuis le pied de page de la boutique.</div>
        </div>
        <div class="adm-page-actions">
          <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" (click)="copyEmails()" [disabled]="!activeCount()"><i class="fa-regular fa-copy"></i> Copier les emails</button>
          <button type="button" class="adm-btn adm-btn-sm" (click)="exportCsv()" [disabled]="!subscribers().length"><i class="fa-solid fa-file-arrow-down"></i> Exporter</button>
        </div>
      </div>
      <div class="adm-toolbar">
        <label class="adm-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input class="adm-input" type="search" [ngModel]="search()" (ngModelChange)="search.set($event); page.set(1)" placeholder="Rechercher un email..." aria-label="Rechercher un abonné" />
        </label>
      </div>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead><tr><th>Email</th><th>Inscription</th><th>Statut</th><th class="actions">Actions</th></tr></thead>
          <tbody>
            @if (loading()) {
              @for (i of [1, 2, 3]; track i) { <tr><td colspan="4"><div class="adm-skel" style="height: 22px"></div></td></tr> }
            } @else {
              @for (s of paged(); track s.id) {
                <tr>
                  <td class="strong">{{ s.email }}</td>
                  <td class="muted">{{ formatDate(s.createdAt) }}</td>
                  <td><span class="adm-badge dot" [class.green]="s.isActive" [class.grey]="!s.isActive">{{ s.isActive ? 'Abonné' : 'Désabonné' }}</span></td>
                  <td class="actions">
                    <button type="button" class="adm-icon-btn sm danger" (click)="remove(s)" [disabled]="busyId() === s.id" aria-label="Supprimer l'abonné"><i class="fa-regular fa-trash-can"></i></button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4"><div class="adm-empty"><i class="fa-regular fa-paper-plane"></i><strong>Aucun abonné</strong>Les inscriptions à la newsletter apparaîtront ici.</div></td></tr>
              }
            }
          </tbody>
        </table>
      </div>
      @if (pageCount() > 1) {
        <footer class="pager">
          <span>{{ filtered().length }} abonné(s) — page {{ page() }} / {{ pageCount() }}</span>
          <div>
            <button type="button" class="adm-icon-btn sm" [disabled]="page() <= 1" (click)="page.set(page() - 1)" aria-label="Page précédente"><i class="fa-solid fa-chevron-left"></i></button>
            <button type="button" class="adm-icon-btn sm" [disabled]="page() >= pageCount()" (click)="page.set(page() + 1)" aria-label="Page suivante"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        </footer>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }
    .tools { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
    .tool { display: flex; flex-direction: column; gap: 6px; padding: 20px; text-decoration: none; transition: transform .2s, box-shadow .2s, border-color .2s; }
    .tool:hover { transform: translateY(-2px); border-color: #f3cadb; box-shadow: 0 12px 26px rgba(214, 69, 127, .12); }
    .tool-icon { width: 46px; height: 46px; border-radius: 12px; background: var(--adm-pink-soft); color: var(--adm-pink); display: inline-flex; align-items: center; justify-content: center; font-size: 1.05rem; margin-bottom: 8px; }
    .tool strong { color: var(--adm-ink); font-size: .95rem; }
    .tool small { color: var(--adm-muted); font-size: .8rem; flex: 1; }
    .tool .adm-link { margin-top: 8px; }
    .adm-card-head { flex-wrap: wrap; }
    .pager { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 22px; border-top: 1px solid var(--adm-line); font-size: .8rem; color: var(--adm-muted); }
    .pager div { display: flex; gap: 8px; }
    @media (max-width: 1100px) { .tools { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 520px) { .tools { grid-template-columns: 1fr; } }
  `],
})
export class AdminMarketingComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  readonly summary = inject(AdminSummaryService).summary;

  readonly subscribers = signal<Subscriber[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal<number | null>(null);
  readonly slidesActive = signal(0);
  readonly couponsActive = signal(0);
  readonly search = signal('');
  readonly page = signal(1);

  readonly activeCount = computed(() => this.subscribers().filter((s) => s.isActive).length);
  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return q ? this.subscribers().filter((s) => s.email.toLowerCase().includes(q)) : this.subscribers();
  });
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly paged = computed(() => {
    const p = Math.min(this.page(), this.pageCount());
    return this.filtered().slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
  });

  readonly formatDate = formatDate;

  ngOnInit(): void {
    forkJoin({
      subs: this.api.get<Subscriber[]>('/admin/newsletter').pipe(catchError(() => of([] as Subscriber[]))),
      slides: this.api.get<{ isActive?: boolean }[]>('/admin/slides').pipe(catchError(() => of([]))),
      coupons: this.api.get<{ isActive: boolean; validTo: string | null }[]>('/admin/coupons').pipe(catchError(() => of([]))),
    }).subscribe(({ subs, slides, coupons }) => {
      this.subscribers.set(subs ?? []);
      this.slidesActive.set((slides ?? []).filter((s) => s.isActive !== false).length);
      this.couponsActive.set(
        (coupons ?? []).filter((c) => c.isActive && (!c.validTo || new Date(c.validTo).getTime() > Date.now())).length,
      );
      this.loading.set(false);
    });
  }

  copyEmails(): void {
    const emails = this.subscribers().filter((s) => s.isActive).map((s) => s.email).join(', ');
    navigator.clipboard?.writeText(emails).then(
      () => this.toast.success(`${this.activeCount()} email(s) copié(s).`),
      () => this.toast.error('Copie impossible.'),
    );
  }

  exportCsv(): void {
    downloadCsv(`newsletter-nera-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Email', 'Inscription', 'Statut'],
      ...this.subscribers().map((s) => [s.email, formatDate(s.createdAt), s.isActive ? 'Abonné' : 'Désabonné']),
    ]);
  }

  remove(s: Subscriber): void {
    if (!confirm(`Supprimer ${s.email} de la newsletter ?`)) return;
    this.busyId.set(s.id);
    this.api.delete(`/admin/newsletter/${s.id}`).subscribe({
      next: () => {
        this.subscribers.update((list) => list.filter((x) => x.id !== s.id));
        this.busyId.set(null);
        this.toast.success('Abonné supprimé.');
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(err?.error?.message || 'Suppression impossible.');
      },
    });
  }
}
