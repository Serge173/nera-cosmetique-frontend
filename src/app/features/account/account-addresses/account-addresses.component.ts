import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AccountOverviewService } from '../shared/account-overview.service';
import { Address } from '../shared/account.models';

const MAX_ADDRESSES = 10;
const LABELS = ['Maison', 'Bureau', 'Famille'];
const CITIES = [
  'Abidjan', 'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi', 'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon',
  'Bingerville', 'Anyama', 'Songon', 'Grand-Bassam', 'Bouaké', 'Yamoussoukro', 'Daloa', 'San-Pédro', 'Korhogo', 'Man', 'Gagnoa', 'Abengourou',
];

interface AddressForm {
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  isDefault: boolean;
}

@Component({
  selector: 'app-account-addresses',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="adm-page-head">
      <div>
        <h1>Mes adresses</h1>
        <p>Enregistrez vos adresses de livraison pour commander plus rapidement.</p>
      </div>
      <button type="button" class="adm-btn" (click)="openNew()" [disabled]="loading() || addresses().length >= max">
        <i class="fa-solid fa-plus"></i> Ajouter une adresse
      </button>
    </div>

    @if (loading()) {
      <div class="grid">
        @for (i of [1, 2, 3]; track i) { <div class="adm-skel sk-card"></div> }
      </div>
    } @else if (error()) {
      <div class="adm-card adm-empty">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Impossible de charger vos adresses.</p>
        <button type="button" class="adm-btn adm-btn-sm" (click)="load()">Réessayer</button>
      </div>
    } @else {
      <div class="grid">
        @for (a of addresses(); track a.id) {
          <article class="adm-card card" [class.default]="a.isDefault">
            <header class="card-head">
              <span class="icon"><i class="fa-solid" [class.fa-house]="!isOffice(a)" [class.fa-briefcase]="isOffice(a)"></i></span>
              <strong class="label">{{ a.label || 'Adresse' }}</strong>
              @if (a.isDefault) { <span class="adm-badge peach"><i class="fa-solid fa-star"></i> Par défaut</span> }
            </header>
            <address>
              <strong>{{ a.firstName }} {{ a.lastName }}</strong>
              <span>{{ a.addressLine1 }}</span>
              @if (a.addressLine2) { <span>{{ a.addressLine2 }}</span> }
              <span>{{ a.city }}, Côte d'Ivoire</span>
              <span class="phone"><i class="fa-solid fa-phone"></i> {{ a.phone }}</span>
            </address>
            <footer class="card-foot">
              @if (confirmId() === a.id) {
                <span class="confirm">Supprimer cette adresse ?</span>
                <button type="button" class="adm-btn adm-btn-danger adm-btn-xs" (click)="remove(a)" [disabled]="busy()">Oui</button>
                <button type="button" class="adm-btn adm-btn-ghost adm-btn-xs" (click)="confirmId.set(null)">Non</button>
              } @else {
                <button type="button" class="link" (click)="openEdit(a)"><i class="fa-solid fa-pen"></i> Modifier</button>
                @if (!a.isDefault) {
                  <button type="button" class="link" (click)="makeDefault(a)" [disabled]="busy()"><i class="fa-regular fa-star"></i> Définir par défaut</button>
                }
                <button type="button" class="link danger" (click)="confirmId.set(a.id)" aria-label="Supprimer cette adresse"><i class="fa-regular fa-trash-can"></i></button>
              }
            </footer>
          </article>
        }

        @if (addresses().length < max) {
          <button type="button" class="add-card" (click)="openNew()">
            <span class="add-icon"><i class="fa-solid fa-plus"></i></span>
            <strong>Ajouter une nouvelle adresse</strong>
            <small>Domicile, bureau, famille…</small>
          </button>
        }
      </div>
      <p class="note"><i class="fa-solid fa-circle-info"></i> Votre adresse par défaut est proposée automatiquement lors de vos commandes. Vous pouvez enregistrer jusqu'à {{ max }} adresses.</p>
    }

    @if (drawerOpen()) {
      <div class="adm-overlay" (click)="close()"></div>
      <aside class="adm-drawer" role="dialog" aria-modal="true" aria-labelledby="addr-drawer-title">
        <div class="adm-drawer-head">
          <h2 id="addr-drawer-title">{{ editingId() ? 'Modifier l’adresse' : 'Nouvelle adresse' }}</h2>
          <button type="button" class="close" (click)="close()" aria-label="Fermer"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form class="adm-drawer-body" id="address-form" (ngSubmit)="save()" #f="ngForm">
          <div class="adm-field">
            <span>Nom de l'adresse</span>
            <div class="adm-chips">
              @for (l of labels; track l) {
                <button type="button" class="adm-chip" [class.active]="form.label === l" (click)="form.label = l">{{ l }}</button>
              }
            </div>
            <input class="adm-input" name="label" [(ngModel)]="form.label" maxlength="60" placeholder="Ou saisissez un nom (ex. Chez maman)" />
          </div>
          <div class="adm-form-grid">
            <label class="adm-field">
              <span>Prénom <b>*</b></span>
              <input class="adm-input" name="firstName" [(ngModel)]="form.firstName" required maxlength="100" autocomplete="given-name" />
            </label>
            <label class="adm-field">
              <span>Nom <b>*</b></span>
              <input class="adm-input" name="lastName" [(ngModel)]="form.lastName" required maxlength="100" autocomplete="family-name" />
            </label>
            <label class="adm-field span-2">
              <span>Téléphone <b>*</b></span>
              <input class="adm-input" type="tel" inputmode="tel" name="phone" [(ngModel)]="form.phone" required maxlength="30" pattern="[+0-9 ().\\-]{6,30}" autocomplete="tel" placeholder="Ex. 07 00 00 00 00" />
              <small>Le livreur vous appellera sur ce numéro.</small>
            </label>
            <label class="adm-field span-2">
              <span>Adresse <b>*</b></span>
              <input class="adm-input" name="addressLine1" [(ngModel)]="form.addressLine1" required maxlength="255" autocomplete="address-line1" placeholder="Quartier, rue, numéro de lot…" />
            </label>
            <label class="adm-field span-2">
              <span>Complément</span>
              <input class="adm-input" name="addressLine2" [(ngModel)]="form.addressLine2" maxlength="255" autocomplete="address-line2" placeholder="Point de repère, bâtiment, étage…" />
            </label>
            <label class="adm-field span-2">
              <span>Ville / commune <b>*</b></span>
              <input class="adm-input" name="city" [(ngModel)]="form.city" required maxlength="100" list="ci-cities" autocomplete="address-level2" />
              <datalist id="ci-cities">
                @for (c of cities; track c) { <option [value]="c"></option> }
              </datalist>
            </label>
          </div>
          @if (!editingDefault()) {
            <label class="adm-switch default-switch">
              <input type="checkbox" name="isDefault" [(ngModel)]="form.isDefault" />
              <span class="track"></span>
              Utiliser comme adresse par défaut
            </label>
          }
          @if (formError()) { <p class="alert" role="alert"><i class="fa-solid fa-circle-exclamation"></i> {{ formError() }}</p> }
        </form>
        <div class="adm-drawer-foot">
          <button type="button" class="adm-btn adm-btn-ghost" (click)="close()">Annuler</button>
          <button type="submit" form="address-form" class="adm-btn" [disabled]="saving() || !f.valid">
            @if (saving()) { <i class="fa-solid fa-spinner fa-spin"></i> Enregistrement… } @else { Enregistrer l'adresse }
          </button>
        </div>
      </aside>
    }
  `,
  styles: [`
    :host { display: block; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
    .card { padding: 20px; display: flex; flex-direction: column; gap: 14px; border: 1.5px solid transparent; }
    .card.default { border-color: #ffd2b0; background: linear-gradient(180deg, #fff9f4 0%, #fff 60%); }
    .card-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .icon { width: 40px; height: 40px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: var(--adm-orange-soft); color: var(--adm-orange); }
    .label { flex: 1; color: var(--adm-ink); }
    address { font-style: normal; display: flex; flex-direction: column; gap: 3px; font-size: .88rem; color: var(--adm-text); word-break: break-word; flex: 1; }
    address strong { color: var(--adm-ink); }
    .phone { margin-top: 4px; }
    .phone i { color: var(--adm-muted); font-size: .78rem; margin-right: 4px; }
    .card-foot { display: flex; align-items: center; gap: 4px; padding-top: 12px; border-top: 1px solid var(--adm-line); flex-wrap: wrap; }
    .link { display: inline-flex; align-items: center; gap: 6px; background: none; padding: 6px 8px; border-radius: 8px; font: inherit; font-size: .8rem; font-weight: 600; color: var(--adm-text); }
    .link:hover:not(:disabled) { background: var(--adm-orange-50); color: var(--adm-orange-dark); }
    .link.danger { margin-left: auto; color: var(--adm-muted); }
    .link.danger:hover { background: #fdeceb; color: #c53b4b; }
    .confirm { font-size: .8rem; color: var(--adm-text); margin-right: auto; }
    .add-card { min-height: 220px; border-radius: var(--adm-radius); border: 2px dashed #f2cdb2; background: #fffaf6; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font: inherit; color: var(--adm-text); transition: background .2s, border-color .2s; }
    .add-card:hover { background: var(--adm-orange-50); border-color: var(--adm-orange); }
    .add-icon { width: 52px; height: 52px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--adm-orange); color: #fff; font-size: 1.2rem; margin-bottom: 6px; box-shadow: 0 8px 20px rgba(255, 102, 0, .25); }
    .add-card small { color: var(--adm-muted); }
    .note { display: flex; gap: 10px; align-items: flex-start; margin: 18px 4px 0; font-size: .8rem; color: var(--adm-muted); }
    .note i { color: var(--adm-orange); margin-top: 2px; }
    .close { width: 36px; height: 36px; border-radius: 10px; background: transparent; color: var(--adm-muted); }
    .close:hover { background: #f4efec; color: var(--adm-ink); }
    .adm-field + .adm-form-grid { margin-top: 18px; }
    .adm-field .adm-chips { margin-bottom: 4px; }
    .adm-field b { color: var(--adm-orange); font-weight: 600; }
    .default-switch { margin-top: 20px; }
    .alert { display: flex; align-items: center; gap: 10px; margin: 18px 0 0; padding: 12px 14px; border-radius: 10px; font-size: .86rem; color: #8c1d18; background: #fdeceb; border: 1px solid #f6c9c6; }
    .sk-card { height: 220px; border-radius: var(--adm-radius); }
    @media (max-width: 520px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  `],
})
export class AccountAddressesComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private overview = inject(AccountOverviewService);

  readonly max = MAX_ADDRESSES;
  readonly labels = LABELS;
  readonly cities = CITIES;
  readonly addresses = signal<Address[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly drawerOpen = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly editingDefault = signal(false);
  readonly saving = signal(false);
  readonly busy = signal(false);
  readonly formError = signal('');
  readonly confirmId = signal<number | null>(null);

  form: AddressForm = this.emptyForm();
  private wantsNew = false;
  private sub?: Subscription;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.drawerOpen()) this.close();
  }

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe((p) => {
      if (p.get('nouveau') !== '1') return;
      this.wantsNew = true;
      this.router.navigate([], { relativeTo: this.route, queryParams: { nouveau: null }, queryParamsHandling: 'merge', replaceUrl: true });
      if (!this.loading()) this.openNewIfRequested();
    });
    this.load();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.get<Address[]>('/account/addresses').subscribe({
      next: (list) => {
        this.addresses.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
        this.openNewIfRequested();
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  isOffice(a: Address): boolean {
    return /bureau|travail|office/i.test(a.label ?? '');
  }

  openNew(): void {
    if (this.addresses().length >= this.max) {
      this.toast.error(`Vous pouvez enregistrer jusqu'à ${this.max} adresses.`);
      return;
    }
    this.form = this.emptyForm();
    this.form.isDefault = this.addresses().length === 0;
    this.editingId.set(null);
    this.editingDefault.set(this.addresses().length === 0);
    this.formError.set('');
    this.drawerOpen.set(true);
  }

  openEdit(a: Address): void {
    this.form = {
      label: a.label ?? '',
      firstName: a.firstName,
      lastName: a.lastName,
      phone: a.phone,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? '',
      city: a.city,
      isDefault: a.isDefault,
    };
    this.editingId.set(a.id);
    this.editingDefault.set(a.isDefault);
    this.formError.set('');
    this.drawerOpen.set(true);
  }

  close(): void {
    if (this.saving()) return;
    this.drawerOpen.set(false);
  }

  save(): void {
    this.formError.set('');
    const payload = {
      label: this.form.label.trim(),
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      phone: this.form.phone.trim(),
      addressLine1: this.form.addressLine1.trim(),
      addressLine2: this.form.addressLine2.trim(),
      city: this.form.city.trim(),
      isDefault: this.form.isDefault,
    };
    if (!payload.firstName || !payload.lastName || !payload.phone || !payload.addressLine1 || !payload.city) {
      this.formError.set('Merci de remplir tous les champs obligatoires.');
      return;
    }
    if (!/^[+0-9 ().-]{6,30}$/.test(payload.phone)) {
      this.formError.set('Numéro de téléphone invalide.');
      return;
    }
    const id = this.editingId();
    this.saving.set(true);
    const request = id
      ? this.api.patch<Address>(`/account/addresses/${id}`, payload)
      : this.api.post<Address>('/account/addresses', payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.drawerOpen.set(false);
        this.toast.success(id ? 'Adresse mise à jour.' : 'Adresse ajoutée.');
        this.afterChange();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(err?.error?.message ?? 'Impossible d’enregistrer cette adresse.');
      },
    });
  }

  makeDefault(a: Address): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.api.patch<Address>(`/account/addresses/${a.id}`, { isDefault: true }).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success('Adresse par défaut mise à jour.');
        this.afterChange();
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(err?.error?.message ?? 'Impossible de modifier l’adresse par défaut.');
      },
    });
  }

  remove(a: Address): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.api.delete(`/account/addresses/${a.id}`).subscribe({
      next: () => {
        this.busy.set(false);
        this.confirmId.set(null);
        this.toast.success('Adresse supprimée.');
        this.afterChange();
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(err?.error?.message ?? 'Impossible de supprimer cette adresse.');
      },
    });
  }

  private afterChange(): void {
    this.load();
    this.overview.refresh();
  }

  private openNewIfRequested(): void {
    if (!this.wantsNew) return;
    this.wantsNew = false;
    this.openNew();
  }

  private emptyForm(): AddressForm {
    const u = this.auth.getCurrentUser();
    return {
      label: 'Maison',
      firstName: u?.firstName ?? '',
      lastName: u?.lastName ?? '',
      phone: u?.phone ?? '',
      addressLine1: '',
      addressLine2: '',
      city: 'Abidjan',
      isDefault: false,
    };
  }
}
