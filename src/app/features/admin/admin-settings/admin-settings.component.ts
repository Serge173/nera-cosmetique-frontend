import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatPrice } from '../shared/admin-format';

interface DeliveryZone {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  minOrderFreeDelivery: number | string | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  isActive: boolean;
}

interface ZoneForm {
  name: string;
  description: string;
  price: number | null;
  minOrderFreeDelivery: number | null;
  estimatedDaysMin: number | null;
  estimatedDaysMax: number | null;
  isActive: boolean;
}

const emptyZone = (): ZoneForm => ({
  name: '', description: '', price: 0, minOrderFreeDelivery: null, estimatedDaysMin: 1, estimatedDaysMax: 3, isActive: true,
});

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="adm-page-head">
      <div>
        <h1>Paramètres</h1>
        <p>Configurez votre boutique : catalogue, livraison, équipe et sécurité.</p>
      </div>
    </header>

    <div class="shortcuts">
      @for (s of shortcuts; track s.title) {
        <a class="adm-card sc" [routerLink]="s.link" [queryParams]="s.query">
          <span class="sc-icon"><i class="fa-solid {{ s.icon }}"></i></span>
          <span class="sc-text"><strong>{{ s.title }}</strong><small>{{ s.text }}</small></span>
          <i class="fa-solid fa-chevron-right sc-caret"></i>
        </a>
      }
    </div>

    <section class="adm-card">
      <div class="adm-card-head">
        <div>
          <h2>Zones de livraison</h2>
          <div class="adm-sub">Tarifs et délais proposés au client lors de la commande.</div>
        </div>
        <button type="button" class="adm-btn adm-btn-sm" (click)="openForm()"><i class="fa-solid fa-plus"></i> Ajouter une zone</button>
      </div>
      <div class="adm-card-body">
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead><tr><th>Zone</th><th>Tarif</th><th>Livraison offerte dès</th><th>Délai</th><th>Statut</th><th class="actions">Actions</th></tr></thead>
            <tbody>
              @if (loading()) {
                @for (i of [1, 2]; track i) { <tr><td colspan="6"><div class="adm-skel" style="height: 24px"></div></td></tr> }
              } @else {
                @for (z of zones(); track z.id) {
                  <tr>
                    <td><div class="strong">{{ z.name }}</div>@if (z.description) {<div class="muted">{{ z.description }}</div>}</td>
                    <td class="strong nowrap">{{ +z.price ? formatPrice(z.price) : 'Gratuit' }}</td>
                    <td class="muted nowrap">{{ z.minOrderFreeDelivery ? formatPrice(z.minOrderFreeDelivery) : '—' }}</td>
                    <td class="muted nowrap">{{ delayText(z) }}</td>
                    <td><span class="adm-badge dot" [class.green]="z.isActive" [class.grey]="!z.isActive">{{ z.isActive ? 'Active' : 'Inactive' }}</span></td>
                    <td class="actions">
                      <button type="button" class="adm-icon-btn sm" (click)="openForm(z)" aria-label="Modifier"><i class="fa-solid fa-pen"></i></button>
                      <button type="button" class="adm-icon-btn sm danger" (click)="remove(z)" [disabled]="busyId() === z.id" aria-label="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="6"><div class="adm-empty"><i class="fa-solid fa-truck"></i><strong>Aucune zone de livraison</strong>Ajoutez vos zones (ex. Abidjan, intérieur du pays).</div></td></tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="adm-card security">
      <div class="adm-card-head"><h2>Sécurité</h2></div>
      <div class="adm-card-body sec-grid">
        <div class="sec-item ok">
          <i class="fa-solid fa-shield-halved"></i>
          <div><strong>Connexions protégées</strong><p>Limitation des tentatives de connexion et chiffrement HTTPS actifs sur la boutique et l'API.</p></div>
        </div>
        <div class="sec-item ok">
          <i class="fa-solid fa-user-lock"></i>
          <div><strong>Accès réservé</strong><p>Seuls les comptes administrateurs peuvent ouvrir cette console. Gérez-les depuis « Utilisateurs ».</p></div>
        </div>
        <div class="sec-item warn">
          <i class="fa-solid fa-key"></i>
          <div><strong>Recommandé</strong><p>Utilisez un mot de passe unique et activez la double authentification sur Vercel, GitHub et Neon.</p></div>
        </div>
      </div>
    </section>

    @if (formOpen()) {
      <div class="adm-overlay" (click)="closeForm()"></div>
      <aside class="adm-drawer" role="dialog" aria-modal="true" aria-label="Zone de livraison">
        <form class="drawer-form" (ngSubmit)="save()">
          <div class="adm-drawer-head">
            <h2>{{ editing() ? 'Modifier la zone' : 'Nouvelle zone de livraison' }}</h2>
            <button type="button" class="adm-icon-btn" (click)="closeForm()" aria-label="Fermer"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="adm-drawer-body">
            <div class="adm-form-grid">
              <label class="adm-field span-2"><span>Nom de la zone *</span><input class="adm-input" name="name" [(ngModel)]="form.name" required maxlength="120" placeholder="Ex : Abidjan" /></label>
              <label class="adm-field span-2"><span>Description</span><input class="adm-input" name="description" [(ngModel)]="form.description" maxlength="500" placeholder="Communes couvertes, précisions..." /></label>
              <label class="adm-field"><span>Tarif (F CFA)</span><input class="adm-input" type="number" name="price" [(ngModel)]="form.price" min="0" step="100" /></label>
              <label class="adm-field"><span>Livraison offerte dès (F CFA)</span><input class="adm-input" type="number" name="free" [(ngModel)]="form.minOrderFreeDelivery" min="0" step="500" placeholder="Jamais" /></label>
              <label class="adm-field"><span>Délai minimum (jours)</span><input class="adm-input" type="number" name="dmin" [(ngModel)]="form.estimatedDaysMin" min="0" step="1" /></label>
              <label class="adm-field"><span>Délai maximum (jours)</span><input class="adm-input" type="number" name="dmax" [(ngModel)]="form.estimatedDaysMax" min="0" step="1" /></label>
              <label class="adm-switch span-2"><input type="checkbox" name="active" [(ngModel)]="form.isActive" /><span class="track"></span> Zone active</label>
            </div>
          </div>
          <div class="adm-drawer-foot">
            <button type="button" class="adm-btn adm-btn-ghost" (click)="closeForm()">Annuler</button>
            <button type="submit" class="adm-btn" [disabled]="saving()"><i class="fa-solid fa-check"></i> Enregistrer</button>
          </div>
        </form>
      </aside>
    }
  `,
  styles: [`
    :host { display: block; }
    .nowrap { white-space: nowrap; }
    .shortcuts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
    .sc { display: flex; align-items: center; gap: 14px; padding: 16px 18px; text-decoration: none; transition: transform .2s, box-shadow .2s, border-color .2s; }
    .sc:hover { transform: translateY(-2px); border-color: #f8d9c5; box-shadow: 0 12px 26px rgba(255, 102, 0, .1); }
    .sc-icon { width: 44px; height: 44px; border-radius: 12px; background: var(--adm-orange-soft); color: var(--adm-orange); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sc-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .sc-text strong { font-size: .88rem; color: var(--adm-ink); }
    .sc-text small { font-size: .76rem; color: var(--adm-muted); }
    .sc-caret { font-size: .7rem; color: #c9c1bc; }
    .security { margin-top: 20px; }
    .sec-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .sec-item { display: flex; gap: 12px; padding: 16px; border-radius: 12px; border: 1px solid var(--adm-line); }
    .sec-item > i { width: 38px; height: 38px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sec-item.ok > i { background: #e3f6ea; color: #2b8a52; }
    .sec-item.warn > i { background: #fff4dc; color: #b7791f; }
    .sec-item strong { font-size: .86rem; color: var(--adm-ink); }
    .sec-item p { margin: 4px 0 0; font-size: .8rem; color: var(--adm-muted); line-height: 1.5; }
    .drawer-form { display: flex; flex-direction: column; height: 100%; }
    @media (max-width: 1100px) { .shortcuts, .sec-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .shortcuts, .sec-grid { grid-template-columns: 1fr; } }
  `],
})
export class AdminSettingsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly shortcuts: { icon: string; title: string; text: string; link: string; query?: Record<string, string> }[] = [
    { icon: 'fa-address-card', title: 'Informations de la boutique', text: 'Coordonnées, adresse, réseaux, mentions légales', link: '/admin/contenu' },
    { icon: 'fa-file-lines', title: 'Pages du site', text: 'À propos, CGV, confidentialité, retours', link: '/admin/contenu', query: { onglet: 'pages' } },
    { icon: 'fa-folder-open', title: 'Catégories', text: 'Organisation du catalogue', link: '/admin/categories' },
    { icon: 'fa-copyright', title: 'Marques', text: 'Marques distribuées', link: '/admin/brands' },
    { icon: 'fa-users-gear', title: 'Utilisateurs & accès', text: 'Comptes administrateurs et clients', link: '/admin/users' },
    { icon: 'fa-images', title: "Slides d'accueil", text: "Bannières de la page d'accueil", link: '/admin/slides' },
    { icon: 'fa-user-pen', title: 'Mon compte', text: 'Profil et mot de passe', link: '/compte' },
    { icon: 'fa-store', title: 'Voir la boutique', text: 'Ouvrir le site public', link: '/' },
  ];

  readonly zones = signal<DeliveryZone[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal<number | null>(null);
  readonly formOpen = signal(false);
  readonly editing = signal<DeliveryZone | null>(null);
  readonly saving = signal(false);
  form: ZoneForm = emptyZone();

  readonly formatPrice = formatPrice;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<DeliveryZone[]>('/admin/delivery-zones').subscribe({
      next: (list) => {
        this.zones.set(list ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Impossible de charger les zones de livraison.');
      },
    });
  }

  delayText(z: DeliveryZone): string {
    const a = z.estimatedDaysMin;
    const b = z.estimatedDaysMax;
    if (a === null && b === null) return '—';
    if (a !== null && b !== null && a !== b) return `${a} à ${b} jours`;
    const n = (a ?? b) as number;
    return n === 0 ? 'Le jour même' : `${n} jour${n > 1 ? 's' : ''}`;
  }

  openForm(z?: DeliveryZone): void {
    this.editing.set(z ?? null);
    this.form = z
      ? {
          name: z.name,
          description: z.description ?? '',
          price: Number(z.price),
          minOrderFreeDelivery: z.minOrderFreeDelivery !== null ? Number(z.minOrderFreeDelivery) : null,
          estimatedDaysMin: z.estimatedDaysMin,
          estimatedDaysMax: z.estimatedDaysMax,
          isActive: z.isActive,
        }
      : emptyZone();
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  save(): void {
    const f = this.form;
    if (!f.name.trim()) {
      this.toast.error('Le nom de la zone est obligatoire.');
      return;
    }
    if (f.estimatedDaysMin !== null && f.estimatedDaysMax !== null && f.estimatedDaysMin > f.estimatedDaysMax) {
      this.toast.error('Le délai minimum doit être inférieur au délai maximum.');
      return;
    }
    const body = {
      name: f.name.trim(),
      description: f.description.trim() || null,
      price: f.price ?? 0,
      minOrderFreeDelivery: f.minOrderFreeDelivery || null,
      estimatedDaysMin: f.estimatedDaysMin,
      estimatedDaysMax: f.estimatedDaysMax,
      isActive: f.isActive,
    };
    const edit = this.editing();
    this.saving.set(true);
    const req = edit ? this.api.patch(`/admin/delivery-zones/${edit.id}`, body) : this.api.post('/admin/delivery-zones', body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(edit ? 'Zone mise à jour.' : 'Zone ajoutée.');
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message || 'Enregistrement impossible.');
      },
    });
  }

  remove(z: DeliveryZone): void {
    if (!confirm(`Supprimer la zone « ${z.name} » ? Si elle a déjà servi, elle sera désactivée.`)) return;
    this.busyId.set(z.id);
    this.api.delete<{ deactivated?: boolean }>(`/admin/delivery-zones/${z.id}`).subscribe({
      next: (res) => {
        this.busyId.set(null);
        this.toast.success(res?.deactivated ? 'Zone désactivée (déjà utilisée par des commandes).' : 'Zone supprimée.');
        this.load();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(err?.error?.message || 'Suppression impossible.');
      },
    });
  }
}
