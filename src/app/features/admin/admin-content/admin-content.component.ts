import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SiteService, SiteSettings } from '../../../core/services/site.service';
import { ToastService } from '../../../core/services/toast.service';
import { formatDateTime } from '../shared/admin-format';

type Tab = 'infos' | 'pages';
type SettingsForm = SiteSettings;

interface Field {
  key: keyof SiteSettings;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'url' | 'textarea';
  placeholder?: string;
  hint?: string;
  icon?: string;
  full?: boolean;
  max: number;
  required?: boolean;
}

interface Group {
  id: string;
  title: string;
  text: string;
  icon: string;
  fields: Field[];
}

interface PageRow {
  slug: string;
  kind: 'about' | 'legal';
  label: string;
  customized: boolean;
  updatedAt: string | null;
}

const PAGE_ICONS: Record<string, string> = {
  'a-propos': 'fa-solid fa-heart',
  cgv: 'fa-solid fa-file-contract',
  'politique-confidentialite': 'fa-solid fa-user-shield',
  retours: 'fa-solid fa-rotate-left',
  'mentions-legales': 'fa-solid fa-scale-balanced',
};

const GROUPS: Group[] = [
  {
    id: 'identite', title: 'Identité de la boutique', text: 'Nom et slogan affichés dans le pied de page et les pages du site.', icon: 'fa-solid fa-store',
    fields: [
      { key: 'storeName', label: 'Nom de la boutique *', max: 80, required: true },
      { key: 'tagline', label: 'Slogan', max: 160, placeholder: 'Ex. Produits cosmétiques importés de France' },
    ],
  },
  {
    id: 'coordonnees', title: 'Coordonnées', text: 'Affichées sur la page Contact, le pied de page, le service client et les pages légales.', icon: 'fa-solid fa-address-book',
    fields: [
      { key: 'email', label: 'E-mail de contact', type: 'email', max: 120, icon: 'fa-regular fa-envelope' },
      { key: 'phone', label: 'Téléphone', type: 'tel', max: 30, icon: 'fa-solid fa-phone', placeholder: '+225 07 00 00 00 00' },
      { key: 'whatsapp', label: 'Numéro WhatsApp', type: 'tel', max: 30, icon: 'fa-brands fa-whatsapp', placeholder: '+225 07 00 00 00 00', hint: 'Avec l’indicatif +225. Utilisé pour tous les boutons WhatsApp du site.' },
      { key: 'responseTime', label: 'Délai de réponse', max: 160, placeholder: 'Ex. Réponse sous 24 à 48 h ouvrées.' },
      { key: 'openingHours', label: 'Horaires d’ouverture', type: 'textarea', max: 400, full: true, placeholder: 'Ex.\nLundi – Vendredi : 8h – 18h\nSamedi : 9h – 14h', hint: 'Une ligne par période. Laissez vide pour ne rien afficher.' },
    ],
  },
  {
    id: 'adresse', title: 'Adresse & carte', text: 'Adresse de la boutique et emplacement affiché sur la carte Google Maps.', icon: 'fa-solid fa-location-dot',
    fields: [
      { key: 'address', label: 'Adresse', max: 200, full: true, placeholder: 'Ex. Cocody Angré, 8e tranche, près de la pharmacie…' },
      { key: 'city', label: 'Ville', max: 80 },
      { key: 'country', label: 'Pays', max: 80 },
      { key: 'mapQuery', label: 'Recherche Google Maps', max: 200, full: true, hint: 'Le nom du lieu ou l’adresse tel que vous le taperiez dans Google Maps. Vérifiez l’aperçu ci-dessous.' },
    ],
  },
  {
    id: 'reseaux', title: 'Réseaux sociaux', text: 'Laissez un champ vide pour masquer le réseau correspondant.', icon: 'fa-solid fa-share-nodes',
    fields: [
      { key: 'facebook', label: 'Facebook', type: 'url', max: 300, icon: 'fa-brands fa-facebook-f', placeholder: 'https://www.facebook.com/…' },
      { key: 'instagram', label: 'Instagram', type: 'url', max: 300, icon: 'fa-brands fa-instagram', placeholder: 'https://www.instagram.com/…' },
      { key: 'tiktok', label: 'TikTok', type: 'url', max: 300, icon: 'fa-brands fa-tiktok', placeholder: 'https://www.tiktok.com/@…' },
      { key: 'twitter', label: 'Twitter / X', type: 'url', max: 300, icon: 'fa-brands fa-x-twitter', placeholder: 'https://x.com/…' },
      { key: 'snapchat', label: 'Snapchat', type: 'url', max: 300, icon: 'fa-brands fa-snapchat', placeholder: 'https://www.snapchat.com/add/…' },
      { key: 'youtube', label: 'YouTube', type: 'url', max: 300, icon: 'fa-brands fa-youtube', placeholder: 'https://www.youtube.com/@…' },
    ],
  },
  {
    id: 'legal', title: 'Informations légales', text: 'Affichées dans les mentions légales. Renseignez celles de votre entreprise.', icon: 'fa-solid fa-scale-balanced',
    fields: [
      { key: 'legalName', label: 'Raison sociale', max: 120 },
      { key: 'legalForm', label: 'Forme juridique', max: 80, placeholder: 'Ex. SARL, Entreprise individuelle…' },
      { key: 'capital', label: 'Capital social', max: 80, placeholder: 'Ex. 1 000 000 F CFA' },
      { key: 'rccm', label: 'N° RCCM', max: 60, placeholder: 'Ex. CI-ABJ-2024-B-12345' },
      { key: 'ncc', label: 'N° compte contribuable (NCC)', max: 60 },
      { key: 'director', label: 'Directeur de la publication', max: 120 },
      { key: 'headOffice', label: 'Siège social', max: 200, full: true, hint: 'Si vide, l’adresse de la boutique est utilisée.' },
      { key: 'hostInfo', label: 'Hébergeur du site', type: 'textarea', max: 400, full: true },
    ],
  },
];

@Component({
  selector: 'app-admin-content',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <header class="adm-page-head">
      <div>
        <h1>Pages & informations</h1>
        <p>Modifiez les pages du site et les informations de la boutique : coordonnées, adresse, réseaux sociaux…</p>
      </div>
    </header>

    <div class="adm-chips tabs" role="tablist">
      <button type="button" role="tab" class="adm-chip" [class.active]="tab() === 'infos'" [attr.aria-selected]="tab() === 'infos'" (click)="setTab('infos')">
        <i class="fa-solid fa-store"></i> Informations de la boutique
      </button>
      <button type="button" role="tab" class="adm-chip" [class.active]="tab() === 'pages'" [attr.aria-selected]="tab() === 'pages'" (click)="setTab('pages')">
        <i class="fa-regular fa-file-lines"></i> Pages du site
      </button>
    </div>

    @if (tab() === 'infos') {
      @if (form) {
        <form class="groups" (ngSubmit)="save()" novalidate>
          @for (g of groups; track g.id) {
            <section class="adm-card group" [attr.aria-labelledby]="'g-' + g.id">
              <header class="g-head">
                <span class="g-icon"><i [class]="g.icon"></i></span>
                <div><h2 [id]="'g-' + g.id">{{ g.title }}</h2><p>{{ g.text }}</p></div>
              </header>
              <div class="adm-form-grid">
                @for (f of g.fields; track f.key) {
                  <label class="adm-field" [class.span-2]="f.full">
                    <span>{{ f.label }}</span>
                    @if (f.type === 'textarea') {
                      <textarea class="adm-textarea" [name]="f.key" [(ngModel)]="form[f.key]" [maxlength]="f.max" [placeholder]="f.placeholder ?? ''" rows="3"></textarea>
                    } @else {
                      <div class="input-icon" [class.has-icon]="!!f.icon">
                        @if (f.icon) { <i [class]="f.icon" aria-hidden="true"></i> }
                        <input class="adm-input" [type]="f.type ?? 'text'" [name]="f.key" [(ngModel)]="form[f.key]" [maxlength]="f.max"
                          [placeholder]="f.placeholder ?? ''" [required]="!!f.required" [attr.inputmode]="f.type === 'tel' ? 'tel' : null" />
                      </div>
                    }
                    @if (f.hint) { <small>{{ f.hint }}</small> }
                  </label>
                }
              </div>
              @if (g.id === 'adresse') {
                <div class="map-preview">
                  @if (previewMap(); as url) {
                    <iframe title="Aperçu de la carte" [src]="url" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                  } @else {
                    <div class="adm-empty"><i class="fa-solid fa-map-location-dot"></i>Renseignez une recherche Google Maps pour afficher la carte.</div>
                  }
                </div>
                <div class="map-actions">
                  <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" (click)="useAddressForMap()" [disabled]="!composedAddress()">
                    <i class="fa-solid fa-location-crosshairs"></i> Utiliser l’adresse ci-dessus
                  </button>
                  <button type="button" class="adm-btn adm-btn-ghost adm-btn-sm" (click)="refreshMap()"><i class="fa-solid fa-rotate"></i> Actualiser l’aperçu</button>
                </div>
              }
              @if (g.id === 'coordonnees' && whatsappPreview()) {
                <p class="wa-test"><i class="fa-brands fa-whatsapp"></i> Lien WhatsApp : <a [href]="whatsappPreview()" target="_blank" rel="noopener noreferrer">{{ whatsappPreview() }}</a></p>
              }
            </section>
          }

          <div class="save-bar" [class.visible]="dirty()">
            <span><i class="fa-solid fa-circle-info"></i> Modifications non enregistrées</span>
            <div>
              <button type="button" class="adm-btn adm-btn-ghost" (click)="reset()" [disabled]="saving()">Annuler</button>
              <button type="submit" class="adm-btn" [disabled]="saving() || !dirty()">
                @if (saving()) { Enregistrement… } @else { <i class="fa-solid fa-check"></i> Enregistrer }
              </button>
            </div>
          </div>
          @if (updatedAt()) { <p class="last-update">Dernière modification : {{ formatDateTime(updatedAt()!) }}</p> }
        </form>
      } @else if (loadError()) {
        <div class="adm-card adm-empty"><i class="fa-solid fa-triangle-exclamation"></i><strong>Chargement impossible</strong><button type="button" class="adm-btn adm-btn-sm" (click)="loadSettings()">Réessayer</button></div>
      } @else {
        @for (i of [1, 2, 3]; track i) { <div class="adm-card group"><div class="adm-skel" style="height: 120px"></div></div> }
      }
    } @else {
      <div class="pages">
        @for (p of pages(); track p.slug) {
          <article class="adm-card page-card">
            <span class="p-icon"><i [class]="pageIcon(p.slug)"></i></span>
            <div class="p-body">
              <h2>{{ p.label }}</h2>
              <p class="p-url">/{{ p.slug }}</p>
              <div class="p-meta">
                @if (p.customized) {
                  <span class="adm-badge green dot">Personnalisée</span>
                  <span class="muted">Modifiée le {{ formatDateTime(p.updatedAt!) }}</span>
                } @else {
                  <span class="adm-badge grey dot">Texte d’origine</span>
                }
              </div>
            </div>
            <div class="p-actions">
              <a class="adm-btn adm-btn-sm" [routerLink]="['/admin/contenu', p.slug]"><i class="fa-solid fa-pen"></i> Modifier</a>
              <a class="adm-btn adm-btn-ghost adm-btn-sm" [href]="'/' + p.slug" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> Voir</a>
            </div>
          </article>
        } @empty {
          @if (pagesLoading()) {
            @for (i of [1, 2, 3]; track i) { <div class="adm-card page-card"><div class="adm-skel" style="height: 56px; width: 100%"></div></div> }
          } @else {
            <div class="adm-card adm-empty"><i class="fa-regular fa-file-lines"></i><strong>Chargement impossible</strong><button type="button" class="adm-btn adm-btn-sm" (click)="loadPages()">Réessayer</button></div>
          }
        }
        <p class="pages-hint"><i class="fa-regular fa-lightbulb"></i> Le formulaire de contact et la boutique utilisent automatiquement les informations de l’onglet « Informations de la boutique ».</p>
      </div>
    }
  `,
  styles: [`
    :host { display: block; padding-bottom: 80px; }
    .tabs { margin-bottom: 18px; }
    .tabs .adm-chip { gap: 8px; }
    .groups { display: flex; flex-direction: column; gap: 18px; }
    .group { padding: 22px; }
    .g-head { display: flex; gap: 14px; align-items: flex-start; padding-bottom: 16px; margin-bottom: 18px; border-bottom: 1px solid var(--adm-line); }
    .g-head h2 { margin: 0; font-size: 1.02rem; font-weight: 700; }
    .g-head p { margin: 3px 0 0; font-size: .82rem; color: var(--adm-muted); }
    .g-icon { width: 42px; height: 42px; border-radius: 12px; background: var(--adm-orange-soft); color: var(--adm-orange); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .input-icon { position: relative; }
    .input-icon.has-icon i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--adm-muted); font-size: .9rem; width: 1em; text-align: center; pointer-events: none; }
    .input-icon.has-icon .adm-input { padding-left: 40px; }
    .map-preview { margin-top: 16px; border-radius: 14px; overflow: hidden; border: 1px solid var(--adm-line); aspect-ratio: 16 / 6; background: #faf7f5; }
    .map-preview iframe { width: 100%; height: 100%; border: 0; display: block; }
    .map-preview .adm-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .map-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .wa-test { margin: 14px 0 0; font-size: .8rem; color: var(--adm-muted); display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .wa-test i { color: #25d366; }
    .wa-test a { color: var(--adm-orange); word-break: break-all; }
    .save-bar {
      position: sticky; bottom: 16px; z-index: 5; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
      padding: 12px 16px; border-radius: 14px; background: var(--adm-ink); color: #fff; box-shadow: var(--adm-shadow-lg);
      transform: translateY(20px); opacity: 0; visibility: hidden; pointer-events: none; transition: transform .25s, opacity .25s, visibility .25s;
    }
    .save-bar.visible { transform: none; opacity: 1; visibility: visible; pointer-events: auto; }
    .save-bar > span { display: flex; gap: 8px; align-items: center; font-size: .88rem; }
    .save-bar > div { display: flex; gap: 8px; }
    .save-bar .adm-btn-ghost { background: transparent; color: #fff; border-color: rgba(255, 255, 255, .3); }
    .last-update { margin: 0; font-size: .78rem; color: var(--adm-muted); text-align: right; }
    .pages { display: flex; flex-direction: column; gap: 12px; }
    .page-card { display: flex; align-items: center; gap: 16px; padding: 16px 20px; }
    .p-icon { width: 46px; height: 46px; border-radius: 12px; background: var(--adm-orange-soft); color: var(--adm-orange); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.05rem; }
    .p-body { flex: 1; min-width: 0; }
    .p-body h2 { margin: 0; font-size: .98rem; font-weight: 700; }
    .p-url { margin: 2px 0 6px; font-size: .78rem; color: var(--adm-muted); font-family: ui-monospace, monospace; }
    .p-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; font-size: .78rem; }
    .muted { color: var(--adm-muted); }
    .p-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .pages-hint { margin: 6px 0 0; font-size: .8rem; color: var(--adm-muted); display: flex; gap: 8px; align-items: center; }
    @media (max-width: 640px) {
      .group { padding: 16px; }
      .adm-form-grid { grid-template-columns: minmax(0, 1fr); }
      .page-card { flex-wrap: wrap; }
      .p-actions { width: 100%; }
      .p-actions .adm-btn { flex: 1; justify-content: center; }
      .map-preview { aspect-ratio: 4 / 3; }
    }
  `],
})
export class AdminContentComponent implements OnInit {
  private api = inject(ApiService);
  private site = inject(SiteService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  readonly groups = GROUPS;
  readonly tab = signal<Tab>('infos');

  form: SettingsForm | null = null;
  private original = '';
  readonly saving = signal(false);
  readonly loadError = signal(false);
  readonly updatedAt = signal<string | null>(null);
  private readonly mapQuery = signal('');

  readonly pages = signal<PageRow[]>([]);
  readonly pagesLoading = signal(false);

  readonly formatDateTime = formatDateTime;

  readonly previewMap = computed<SafeResourceUrl | null>(() => {
    const q = this.mapQuery().trim();
    return q ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`) : null;
  });

  ngOnInit(): void {
    this.tab.set(this.route.snapshot.queryParamMap.get('onglet') === 'pages' ? 'pages' : 'infos');
    this.loadSettings();
    this.loadPages();
  }

  setTab(tab: Tab): void {
    this.tab.set(tab);
    this.router.navigate([], { relativeTo: this.route, queryParams: { onglet: tab === 'pages' ? 'pages' : null }, replaceUrl: true });
  }

  loadSettings(): void {
    this.loadError.set(false);
    this.api.get<SiteSettings & { updatedAt: string | null }>('/admin/site/settings').subscribe({
      next: ({ updatedAt, ...settings }) => {
        this.form = { ...settings };
        this.original = JSON.stringify(this.form);
        this.updatedAt.set(updatedAt);
        this.mapQuery.set(settings.mapQuery);
      },
      error: () => this.loadError.set(true),
    });
  }

  loadPages(): void {
    this.pagesLoading.set(true);
    this.api.get<PageRow[]>('/admin/site/pages').subscribe({
      next: (rows) => {
        this.pages.set(rows ?? []);
        this.pagesLoading.set(false);
      },
      error: () => this.pagesLoading.set(false),
    });
  }

  dirty(): boolean {
    return !!this.form && JSON.stringify(this.form) !== this.original;
  }

  composedAddress(): string {
    const f = this.form;
    return f ? [f.address, f.city, f.country].map((v) => v?.trim()).filter(Boolean).join(', ') : '';
  }

  useAddressForMap(): void {
    if (!this.form) return;
    this.form.mapQuery = this.composedAddress();
    this.refreshMap();
  }

  refreshMap(): void {
    this.mapQuery.set(this.form?.mapQuery ?? '');
  }

  whatsappPreview(): string {
    const digits = (this.form?.whatsapp ?? '').replace(/\D/g, '');
    return digits.length >= 8 ? `https://wa.me/${digits}` : '';
  }

  reset(): void {
    if (!this.original) return;
    this.form = JSON.parse(this.original);
    this.refreshMap();
  }

  save(): void {
    if (!this.form || this.saving()) return;
    const error = this.validate(this.form);
    if (error) {
      this.toast.error(error);
      return;
    }
    this.saving.set(true);
    this.api.put<SiteSettings & { updatedAt: string | null }>('/admin/site/settings', this.form).subscribe({
      next: ({ updatedAt, ...settings }) => {
        this.saving.set(false);
        this.form = { ...settings };
        this.original = JSON.stringify(this.form);
        this.updatedAt.set(updatedAt);
        this.refreshMap();
        this.site.apply(settings);
        this.toast.success('Informations enregistrées. Le site est à jour.');
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.message || 'Enregistrement impossible.');
      },
    });
  }

  private validate(f: SettingsForm): string | null {
    if (!f.storeName?.trim()) return 'Le nom de la boutique est obligatoire.';
    if (f.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return 'L’adresse e-mail n’est pas valide.';
    for (const key of ['phone', 'whatsapp'] as const) {
      const v = f[key]?.trim();
      const digits = (v ?? '').replace(/\D/g, '');
      if (v && (!/^[+0-9 ().-]+$/.test(v) || digits.length < 8 || digits.length > 15)) {
        return key === 'whatsapp' ? 'Le numéro WhatsApp n’est pas valide.' : 'Le numéro de téléphone n’est pas valide.';
      }
    }
    for (const g of GROUPS) {
      for (const field of g.fields) {
        const v = (f[field.key] ?? '').trim();
        if (field.type === 'url' && v && !/^https:\/\/[^\s]+\.[^\s]+$/i.test(v)) {
          return `Le lien ${field.label} doit commencer par https://`;
        }
      }
    }
    return null;
  }

  pageIcon(slug: string): string {
    return PAGE_ICONS[slug] ?? 'fa-regular fa-file-lines';
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) event.preventDefault();
  }
}
