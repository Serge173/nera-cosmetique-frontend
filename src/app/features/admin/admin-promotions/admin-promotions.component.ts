import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDate, formatPrice } from '../shared/admin-format';

interface Coupon {
  id: number;
  code: string;
  type: 'percent' | 'fixed';
  value: number | string;
  minOrderAmount: number | string | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  createdAt: string;
}

interface LoyaltySettings {
  pointValue: number;
  redeemEnabled: boolean;
  welcomeBonus: number;
  amountPerPoint: number;
  stats: { generated: number; used: number; outstanding: number };
}

type CouponState = 'active' | 'inactive' | 'expired' | 'scheduled' | 'exhausted';

const STATE_INFO: Record<CouponState, { label: string; tone: string }> = {
  active: { label: 'Actif', tone: 'green' },
  inactive: { label: 'Désactivé', tone: 'grey' },
  expired: { label: 'Expiré', tone: 'red' },
  scheduled: { label: 'Programmé', tone: 'blue' },
  exhausted: { label: 'Épuisé', tone: 'amber' },
};

interface CouponForm {
  code: string;
  type: 'percent' | 'fixed';
  value: number | null;
  minOrderAmount: number | null;
  maxUses: number | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

const emptyForm = (): CouponForm => ({
  code: '', type: 'percent', value: 10, minOrderAmount: null, maxUses: null, validFrom: '', validTo: '', isActive: true,
});

@Component({
  selector: 'app-admin-promotions',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="adm-page-head">
      <div>
        <h1>Promotions</h1>
        <p>Créez des codes de réduction et suivez leur utilisation.</p>
      </div>
      <div class="adm-page-actions">
        <button type="button" class="adm-btn" (click)="openForm()"><i class="fa-solid fa-plus"></i> Nouveau code promo</button>
      </div>
    </header>

    <div class="adm-stats">
      <div class="adm-card adm-stat">
        <span class="adm-stat-icon green"><i class="fa-solid fa-ticket"></i></span>
        <div><div class="adm-stat-label">Codes actifs</div><div class="adm-stat-value">{{ stats().active }}</div></div>
      </div>
      <div class="adm-card adm-stat">
        <span class="adm-stat-icon"><i class="fa-solid fa-chart-simple"></i></span>
        <div><div class="adm-stat-label">Utilisations</div><div class="adm-stat-value">{{ stats().uses }}</div></div>
      </div>
      <div class="adm-card adm-stat">
        <span class="adm-stat-icon blue"><i class="fa-regular fa-calendar"></i></span>
        <div><div class="adm-stat-label">Programmés</div><div class="adm-stat-value">{{ stats().scheduled }}</div></div>
      </div>
      <div class="adm-card adm-stat">
        <span class="adm-stat-icon red"><i class="fa-regular fa-clock"></i></span>
        <div><div class="adm-stat-label">Expirés / épuisés</div><div class="adm-stat-value">{{ stats().ended }}</div></div>
      </div>
    </div>

    <section class="adm-card loyalty" aria-labelledby="loyalty-title">
      <div class="adm-card-head">
        <div>
          <h2 id="loyalty-title"><i class="fa-solid fa-gift"></i> Programme fidélité — valeur du point</h2>
          <div class="adm-sub">Les clients transforment leurs points en codes promo personnels depuis leur espace « Mes points fidélité ».</div>
        </div>
        @if (loyalty(); as l) {
          <span class="adm-badge dot {{ l.redeemEnabled ? 'green' : 'red' }}">{{ l.redeemEnabled ? 'Conversion active' : 'Conversion bloquée' }}</span>
        }
      </div>
      <div class="adm-card-body loyalty-body">
        @if (loyalty(); as l) {
          <form class="loyalty-form" (ngSubmit)="saveLoyalty()">
            <label class="adm-field">
              <span>Valeur d'un point (F CFA)</span>
              <input class="adm-input" type="number" name="pointValue" [(ngModel)]="pointValue" required min="1" max="100000" step="1" />
              <small>{{ l.welcomeBonus }} points offerts à l'inscription = {{ formatPrice(l.welcomeBonus * (pointValue || 0)) }}.</small>
            </label>
            <div class="adm-field">
              <span>Conversion des points en codes promo</span>
              <label class="adm-switch">
                <input type="checkbox" name="redeemEnabled" [(ngModel)]="redeemEnabled" />
                <span class="track"></span>
                {{ redeemEnabled ? 'Débloquée : les clients peuvent générer des codes' : 'Bloquée : les clients ne peuvent plus générer de codes' }}
              </label>
              <small>Les points restent acquis, et les codes déjà générés restent utilisables.</small>
            </div>
            <div class="loyalty-actions">
              <button type="submit" class="adm-btn" [disabled]="savingLoyalty() || !loyaltyDirty()">
                <i class="fa-solid" [class.fa-check]="!savingLoyalty()" [class.fa-spinner]="savingLoyalty()" [class.fa-spin]="savingLoyalty()"></i>
                Enregistrer
              </button>
            </div>
          </form>
          <ul class="loyalty-stats">
            <li><strong>{{ l.stats.generated }}</strong><span>codes fidélité générés</span></li>
            <li><strong>{{ l.stats.used }}</strong><span>codes utilisés</span></li>
            <li><strong>{{ formatPrice(l.stats.outstanding) }}</strong><span>de codes en attente d'utilisation</span></li>
          </ul>
          <p class="loyalty-note">
            <i class="fa-solid fa-circle-info"></i>
            Un client gagne 1 point par tranche de {{ formatPrice(l.amountPerPoint) }} d'articles livrés. Une nouvelle valeur s'applique aux prochains codes générés ; les codes existants gardent leur montant.
          </p>
        } @else if (loyaltyError()) {
          <div class="adm-empty compact">
            <p>Impossible de charger les réglages fidélité.</p>
            <button type="button" class="adm-btn adm-btn-sm" (click)="loadLoyalty()">Réessayer</button>
          </div>
        } @else {
          <div class="adm-skel" style="height: 120px"></div>
        }
      </div>
    </section>

    <section class="adm-card">
      <div class="adm-card-head">
        <div>
          <h2>Codes de réduction</h2>
          <div class="adm-sub">Les clients saisissent ces codes lors de la validation de leur commande.</div>
        </div>
      </div>
      <div class="adm-card-body">
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Réduction</th>
                <th>Conditions</th>
                <th>Utilisations</th>
                <th>Validité</th>
                <th>Statut</th>
                <th class="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (i of [1, 2, 3]; track i) { <tr><td colspan="7"><div class="adm-skel" style="height: 26px"></div></td></tr> }
              } @else {
                @for (c of coupons(); track c.id) {
                  <tr [class.dim]="stateOf(c) !== 'active' && stateOf(c) !== 'scheduled'">
                    <td>
                      <span class="code">{{ c.code }}</span>
                      <button type="button" class="copy" (click)="copy(c.code)" aria-label="Copier le code"><i class="fa-regular fa-copy"></i></button>
                    </td>
                    <td class="strong nowrap">{{ discountText(c) }}</td>
                    <td class="muted">{{ +(c.minOrderAmount ?? 0) > 0 ? 'Dès ' + formatPrice(c.minOrderAmount) : 'Sans minimum' }}</td>
                    <td>
                      <div class="uses">
                        <span>{{ c.usedCount }}{{ c.maxUses ? ' / ' + c.maxUses : '' }}</span>
                        @if (c.maxUses) {
                          <div class="bar"><i [style.width.%]="usePercent(c)"></i></div>
                        }
                      </div>
                    </td>
                    <td class="muted">{{ validityText(c) }}</td>
                    <td><span class="adm-badge dot {{ stateInfo(c).tone }}">{{ stateInfo(c).label }}</span></td>
                    <td class="actions">
                      <div class="row-actions">
                        <label class="adm-switch" [title]="c.isActive ? 'Désactiver' : 'Activer'">
                          <input type="checkbox" [checked]="c.isActive" (change)="toggle(c)" [disabled]="busyId() === c.id" [attr.aria-label]="'Activer ' + c.code" />
                          <span class="track"></span>
                        </label>
                        <button type="button" class="adm-icon-btn sm" (click)="openForm(c)" aria-label="Modifier"><i class="fa-solid fa-pen"></i></button>
                        <button type="button" class="adm-icon-btn sm danger" (click)="remove(c)" [disabled]="busyId() === c.id" aria-label="Supprimer"><i class="fa-regular fa-trash-can"></i></button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7">
                      <div class="adm-empty">
                        <i class="fa-solid fa-ticket"></i>
                        <strong>Aucun code promo</strong>
                        Créez votre premier code pour booster vos ventes.
                        <div><button type="button" class="adm-btn adm-btn-soft adm-btn-sm first" (click)="openForm()"><i class="fa-solid fa-plus"></i> Créer un code</button></div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="adm-card tip">
      <span class="tip-icon"><i class="fa-solid fa-tags"></i></span>
      <div>
        <strong>Prix promotionnels sur les produits</strong>
        <p>Pour afficher un prix barré sur un article (soldes, offre limitée), définissez son prix promo et ses dates directement dans la fiche produit.</p>
      </div>
      <a routerLink="/admin/products" class="adm-btn adm-btn-ghost adm-btn-sm">Gérer les produits</a>
    </section>

    @if (formOpen()) {
      <div class="adm-overlay" (click)="closeForm()"></div>
      <aside class="adm-drawer" role="dialog" aria-modal="true" [attr.aria-label]="editing() ? 'Modifier le code promo' : 'Nouveau code promo'">
        <form class="drawer-form" (ngSubmit)="save()">
          <div class="adm-drawer-head">
            <h2>{{ editing() ? 'Modifier le code' : 'Nouveau code promo' }}</h2>
            <button type="button" class="adm-icon-btn" (click)="closeForm()" aria-label="Fermer"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="adm-drawer-body">
            <div class="adm-form-grid">
              <label class="adm-field span-2">
                <span>Code *</span>
                <div class="code-row">
                  <input class="adm-input mono" name="code" [(ngModel)]="form.code" (ngModelChange)="form.code = ($event || '').toUpperCase()"
                         required maxlength="30" pattern="[A-Za-z0-9_-]{3,30}" placeholder="EX : BIENVENUE10" />
                  <button type="button" class="adm-btn adm-btn-ghost" (click)="generate()"><i class="fa-solid fa-wand-magic-sparkles"></i> Générer</button>
                </div>
                <small>3 à 30 caractères : lettres, chiffres, tiret ou souligné.</small>
              </label>

              <label class="adm-field">
                <span>Type de réduction *</span>
                <select class="adm-select" name="type" [(ngModel)]="form.type">
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (F CFA)</option>
                </select>
              </label>
              <label class="adm-field">
                <span>Valeur *</span>
                <input class="adm-input" type="number" name="value" [(ngModel)]="form.value" required min="1" [max]="form.type === 'percent' ? 100 : 100000000" step="1" />
              </label>

              <label class="adm-field">
                <span>Commande minimum (F CFA)</span>
                <input class="adm-input" type="number" name="minOrderAmount" [(ngModel)]="form.minOrderAmount" min="0" step="100" placeholder="Aucun" />
              </label>
              <label class="adm-field">
                <span>Utilisations maximum</span>
                <input class="adm-input" type="number" name="maxUses" [(ngModel)]="form.maxUses" min="1" step="1" placeholder="Illimitées" />
              </label>

              <label class="adm-field">
                <span>Début de validité</span>
                <input class="adm-input" type="date" name="validFrom" [(ngModel)]="form.validFrom" />
              </label>
              <label class="adm-field">
                <span>Fin de validité</span>
                <input class="adm-input" type="date" name="validTo" [(ngModel)]="form.validTo" [min]="form.validFrom" />
              </label>

              <label class="adm-switch span-2">
                <input type="checkbox" name="isActive" [(ngModel)]="form.isActive" />
                <span class="track"></span>
                Code actif
              </label>
            </div>

            <div class="preview">
              <i class="fa-solid fa-ticket"></i>
              <div>
                <strong>{{ form.code || 'VOTRECODE' }}</strong>
                <span>{{ previewText() }}</span>
              </div>
            </div>
          </div>
          <div class="adm-drawer-foot">
            <button type="button" class="adm-btn adm-btn-ghost" (click)="closeForm()">Annuler</button>
            <button type="submit" class="adm-btn" [disabled]="saving()">
              <i class="fa-solid" [class.fa-check]="!saving()" [class.fa-spinner]="saving()" [class.fa-spin]="saving()"></i>
              {{ editing() ? 'Enregistrer' : 'Créer le code' }}
            </button>
          </div>
        </form>
      </aside>
    }
  `,
  styles: [`
    :host { display: block; }
    .nowrap { white-space: nowrap; }
    .code {
      font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; font-weight: 700; font-size: .8rem; letter-spacing: .04em;
      background: var(--adm-orange-50); color: var(--adm-orange-dark); border: 1px dashed #f5cfb6; padding: 4px 10px; border-radius: 8px;
    }
    .copy { background: none; color: var(--adm-muted); margin-left: 6px; padding: 4px; border-radius: 6px; }
    .copy:hover { color: var(--adm-orange); background: var(--adm-orange-50); }
    tr.dim td { opacity: .62; }
    tr.dim td.actions { opacity: 1; }
    .uses { display: flex; flex-direction: column; gap: 6px; min-width: 90px; font-size: .82rem; }
    .bar { height: 6px; border-radius: 99px; background: #f5f0ed; overflow: hidden; }
    .bar i { display: block; height: 100%; background: var(--adm-orange); border-radius: 99px; }
    .row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
    .first { margin-top: 14px; }
    .tip { display: flex; align-items: center; gap: 16px; padding: 18px 22px; margin-top: 20px; }
    .tip-icon { width: 44px; height: 44px; border-radius: 12px; background: #fff4dc; color: #b7791f; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .tip div { flex: 1; }
    .tip strong { color: var(--adm-ink); font-size: .9rem; }
    .tip p { margin: 2px 0 0; font-size: .82rem; color: var(--adm-muted); }
    .loyalty { margin-bottom: 20px; }
    .loyalty h2 i { color: var(--adm-orange); margin-right: 6px; }
    .loyalty-body { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 20px 28px; align-items: start; }
    .loyalty-form { display: grid; grid-template-columns: minmax(0, 220px) minmax(0, 1fr) auto; gap: 16px 20px; align-items: start; }
    .loyalty-form .adm-switch { margin-top: 6px; }
    .loyalty-form small { color: var(--adm-muted); font-size: .76rem; }
    .loyalty-actions { padding-top: 22px; }
    .loyalty-stats { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .loyalty-stats li { padding: 12px; border-radius: 12px; background: var(--adm-orange-50); display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .loyalty-stats strong { color: var(--adm-orange-dark); font-size: 1rem; overflow-wrap: anywhere; }
    .loyalty-stats span { color: var(--adm-muted); font-size: .74rem; line-height: 1.3; }
    .loyalty-note { grid-column: 1 / -1; margin: 0; font-size: .8rem; color: var(--adm-muted); display: flex; gap: 8px; align-items: baseline; }
    .loyalty-note i { color: var(--adm-orange); }
    .compact { padding: 20px 12px; }
    @media (max-width: 1280px) {
      .loyalty-body { grid-template-columns: minmax(0, 1fr); }
    }
    @media (max-width: 760px) {
      .loyalty-form { grid-template-columns: minmax(0, 1fr); }
      .loyalty-actions { padding-top: 0; }
      .loyalty-actions .adm-btn { width: 100%; }
    }
    @media (max-width: 460px) {
      .loyalty-stats { grid-template-columns: minmax(0, 1fr); }
    }
    .drawer-form { display: flex; flex-direction: column; height: 100%; }
    .code-row { display: flex; gap: 8px; }
    .mono { font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; letter-spacing: .05em; text-transform: uppercase; }
    .preview {
      margin-top: 24px; display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 14px; color: #fff;
      background: linear-gradient(135deg, #f5a671, #e55a00); box-shadow: 0 12px 28px rgba(255, 102, 0, .3);
    }
    .preview i { font-size: 1.6rem; opacity: .85; }
    .preview strong { display: block; font-family: ui-monospace, Menlo, Consolas, monospace; letter-spacing: .08em; font-size: 1.05rem; }
    .preview span { font-size: .8rem; opacity: .9; }
    @media (max-width: 640px) {
      .tip { flex-direction: column; align-items: flex-start; }
      .code-row { flex-direction: column; }
    }
  `],
})
export class AdminPromotionsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly coupons = signal<Coupon[]>([]);
  readonly loading = signal(true);
  readonly busyId = signal<number | null>(null);
  readonly formOpen = signal(false);
  readonly editing = signal<Coupon | null>(null);
  readonly saving = signal(false);
  form: CouponForm = emptyForm();

  readonly loyalty = signal<LoyaltySettings | null>(null);
  readonly loyaltyError = signal(false);
  readonly savingLoyalty = signal(false);
  pointValue: number | null = null;
  redeemEnabled = true;

  readonly stats = computed(() => {
    const list = this.coupons();
    const states = list.map((c) => this.stateOf(c));
    return {
      active: states.filter((s) => s === 'active').length,
      scheduled: states.filter((s) => s === 'scheduled').length,
      ended: states.filter((s) => s === 'expired' || s === 'exhausted').length,
      uses: list.reduce((s, c) => s + (c.usedCount || 0), 0),
    };
  });

  readonly formatPrice = formatPrice;

  ngOnInit(): void {
    this.load();
    this.loadLoyalty();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      if (p.get('nouveau')) this.openForm();
    });
  }

  load(): void {
    this.api.get<Coupon[]>('/admin/coupons').subscribe({
      next: (list) => {
        this.coupons.set(list ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Impossible de charger les codes promo.');
      },
    });
  }

  loadLoyalty(): void {
    this.loyaltyError.set(false);
    this.api.get<LoyaltySettings>('/admin/loyalty-settings').subscribe({
      next: (l) => this.applyLoyalty(l),
      error: () => this.loyaltyError.set(true),
    });
  }

  loyaltyDirty(): boolean {
    const l = this.loyalty();
    return !!l && (Number(this.pointValue) !== l.pointValue || this.redeemEnabled !== l.redeemEnabled);
  }

  saveLoyalty(): void {
    const value = Number(this.pointValue);
    if (!Number.isInteger(value) || value < 1 || value > 100000) {
      this.toast.error("La valeur d'un point doit être un nombre entier entre 1 et 100 000 F CFA.");
      return;
    }
    this.savingLoyalty.set(true);
    this.api.patch<LoyaltySettings>('/admin/loyalty-settings', { pointValue: value, redeemEnabled: this.redeemEnabled }).subscribe({
      next: (l) => {
        this.savingLoyalty.set(false);
        this.applyLoyalty(l);
        this.toast.success(`Réglages fidélité enregistrés : 1 point = ${formatPrice(l.pointValue)}, conversion ${l.redeemEnabled ? 'débloquée' : 'bloquée'}.`);
      },
      error: (err) => {
        this.savingLoyalty.set(false);
        this.toast.error(err?.error?.message || 'Enregistrement impossible.');
      },
    });
  }

  private applyLoyalty(l: LoyaltySettings): void {
    this.loyalty.set(l);
    this.pointValue = l.pointValue;
    this.redeemEnabled = l.redeemEnabled;
  }

  stateOf(c: Coupon): CouponState {
    const now = Date.now();
    if (!c.isActive) return 'inactive';
    if (c.validTo && new Date(c.validTo).getTime() < now) return 'expired';
    if (c.maxUses && c.usedCount >= c.maxUses) return 'exhausted';
    if (c.validFrom && new Date(c.validFrom).getTime() > now) return 'scheduled';
    return 'active';
  }

  stateInfo(c: Coupon) {
    return STATE_INFO[this.stateOf(c)];
  }

  discountText(c: { type: string; value: number | string | null }): string {
    const v = Number(c.value) || 0;
    return c.type === 'percent' ? `−${v} %` : `−${formatPrice(v)}`;
  }

  usePercent(c: Coupon): number {
    return c.maxUses ? Math.min(100, (c.usedCount / c.maxUses) * 100) : 0;
  }

  validityText(c: Coupon): string {
    if (!c.validFrom && !c.validTo) return 'Permanente';
    if (c.validFrom && c.validTo) return `${formatDate(c.validFrom)} → ${formatDate(c.validTo)}`;
    return c.validFrom ? `Dès le ${formatDate(c.validFrom)}` : `Jusqu'au ${formatDate(c.validTo)}`;
  }

  previewText(): string {
    const parts = [this.form.value ? this.discountText(this.form) : 'Réduction'];
    if (this.form.minOrderAmount) parts.push(`dès ${formatPrice(this.form.minOrderAmount)}`);
    if (this.form.validTo) parts.push(`jusqu'au ${formatDate(this.form.validTo)}`);
    return parts.join(' • ');
  }

  copy(code: string): void {
    navigator.clipboard?.writeText(code).then(
      () => this.toast.success(`Code ${code} copié.`, 2000),
      () => this.toast.error('Copie impossible.'),
    );
  }

  generate(): void {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    this.form.code = 'NERA' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  }

  openForm(c?: Coupon): void {
    this.editing.set(c ?? null);
    this.form = c
      ? {
          code: c.code,
          type: c.type,
          value: Number(c.value),
          minOrderAmount: c.minOrderAmount !== null ? Number(c.minOrderAmount) : null,
          maxUses: c.maxUses,
          validFrom: c.validFrom ? c.validFrom.slice(0, 10) : '',
          validTo: c.validTo ? c.validTo.slice(0, 10) : '',
          isActive: c.isActive,
        }
      : emptyForm();
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    if (this.route.snapshot.queryParamMap.get('nouveau')) {
      this.router.navigate([], { queryParams: { nouveau: null }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  save(): void {
    const f = this.form;
    if (!/^[A-Z0-9_-]{3,30}$/.test(f.code.trim())) {
      this.toast.error('Code invalide : 3 à 30 caractères (lettres, chiffres, - ou _).');
      return;
    }
    if (!f.value || f.value <= 0 || (f.type === 'percent' && f.value > 100)) {
      this.toast.error(f.type === 'percent' ? 'Le pourcentage doit être compris entre 1 et 100.' : 'Le montant doit être positif.');
      return;
    }
    if (f.validFrom && f.validTo && f.validFrom > f.validTo) {
      this.toast.error('La date de fin doit être après la date de début.');
      return;
    }
    const body = {
      code: f.code.trim(),
      type: f.type,
      value: f.value,
      minOrderAmount: f.minOrderAmount || null,
      maxUses: f.maxUses || null,
      validFrom: f.validFrom ? `${f.validFrom}T00:00:00.000Z` : null,
      validTo: f.validTo ? `${f.validTo}T23:59:59.000Z` : null,
      isActive: f.isActive,
    };
    const edit = this.editing();
    this.saving.set(true);
    const req = edit ? this.api.patch<Coupon>(`/admin/coupons/${edit.id}`, body) : this.api.post<Coupon>('/admin/coupons', body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(edit ? 'Code promo mis à jour.' : `Code ${body.code} créé.`);
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message || 'Enregistrement impossible.');
      },
    });
  }

  toggle(c: Coupon): void {
    this.busyId.set(c.id);
    this.api.patch<Coupon>(`/admin/coupons/${c.id}`, { isActive: !c.isActive }).subscribe({
      next: () => {
        this.coupons.update((list) => list.map((x) => (x.id === c.id ? { ...x, isActive: !c.isActive } : x)));
        this.busyId.set(null);
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(err?.error?.message || 'Action impossible.');
        this.load();
      },
    });
  }

  remove(c: Coupon): void {
    if (!confirm(`Supprimer le code ${c.code} ? S'il a déjà été utilisé, il sera simplement désactivé.`)) return;
    this.busyId.set(c.id);
    this.api.delete(`/admin/coupons/${c.id}`).subscribe({
      next: () => {
        this.busyId.set(null);
        this.toast.success('Code promo supprimé.');
        this.load();
      },
      error: (err) => {
        this.busyId.set(null);
        this.toast.error(err?.error?.message || 'Suppression impossible.');
      },
    });
  }
}
