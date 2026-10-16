import { Injectable, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { ApiService } from './api.service';

export interface SiteSettings {
  storeName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  responseTime: string;
  openingHours: string;
  address: string;
  city: string;
  country: string;
  mapQuery: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  twitter: string;
  snapchat: string;
  youtube: string;
  legalName: string;
  legalForm: string;
  capital: string;
  rccm: string;
  ncc: string;
  headOffice: string;
  director: string;
  hostInfo: string;
}

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalContent {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export interface AboutContent {
  heroLabel: string;
  heroTitle: string;
  heroTagline: string;
  storyLabel: string;
  storyTitle: string;
  storyLead: string;
  storyBody: string;
  imageUrl: string;
  imageBadge: string;
  missionTitle: string;
  missionText: string;
  visionTitle: string;
  visionText: string;
  commitmentsLabel: string;
  commitmentsTitle: string;
  commitments: { title: string; text: string }[];
  ctaTitle: string;
  ctaText: string;
}

export interface SitePage<T> {
  content: T;
  updatedAt: string | null;
}

/** Valeurs affichées tant que l'API n'a pas répondu (ou si elle est injoignable). */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  storeName: 'Nera Cosmétique',
  tagline: 'Produits cosmétiques importés de France',
  email: 'skeayeni@gmail.com',
  phone: '+225 07 89 68 44 67',
  whatsapp: '+225 07 89 68 44 67',
  responseTime: 'Réponse sous 24 à 48 h ouvrées.',
  openingHours: '',
  address: '',
  city: 'Abidjan',
  country: "Côte d'Ivoire",
  mapQuery: "Abidjan, Côte d'Ivoire",
  facebook: 'https://www.facebook.com/neracosmetique',
  instagram: 'https://www.instagram.com/neracosmetique',
  tiktok: 'https://www.tiktok.com/@neracosmetique',
  twitter: 'https://twitter.com/neracosmetique',
  snapchat: 'https://www.snapchat.com/add/neracosmetique',
  youtube: '',
  legalName: 'Nera Cosmétique',
  legalForm: '',
  capital: '',
  rccm: '',
  ncc: '',
  headOffice: '',
  director: '',
  hostInfo: '',
};

export interface SocialLink {
  key: string;
  label: string;
  icon: string;
  url: string;
}

const SOCIALS: Omit<SocialLink, 'url'>[] = [
  { key: 'facebook', label: 'Facebook', icon: 'fa-brands fa-facebook-f' },
  { key: 'instagram', label: 'Instagram', icon: 'fa-brands fa-instagram' },
  { key: 'tiktok', label: 'TikTok', icon: 'fa-brands fa-tiktok' },
  { key: 'twitter', label: 'Twitter / X', icon: 'fa-brands fa-x-twitter' },
  { key: 'snapchat', label: 'Snapchat', icon: 'fa-brands fa-snapchat' },
  { key: 'youtube', label: 'YouTube', icon: 'fa-brands fa-youtube' },
];

const safeHttps = (url: string) => (/^https:\/\/[^\s]+$/i.test(url) ? url : '');

@Injectable({ providedIn: 'root' })
export class SiteService {
  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  private readonly state = signal<SiteSettings>(DEFAULT_SITE_SETTINGS);
  private request$?: Observable<SiteSettings>;
  private readonly pageCache = new Map<string, Observable<SitePage<unknown>>>();

  readonly settings = this.state.asReadonly();

  readonly whatsappDigits = computed(() => this.state().whatsapp.replace(/\D/g, ''));
  readonly phoneHref = computed(() => {
    const p = this.state().phone.replace(/[^\d+]/g, '');
    return p ? `tel:${p}` : '';
  });
  readonly fullAddress = computed(() => {
    const s = this.state();
    return [s.address, s.city, s.country].filter(Boolean).join(', ');
  });
  readonly socials = computed<SocialLink[]>(() => {
    const s = this.state() as unknown as Record<string, string>;
    return SOCIALS.map((n) => ({ ...n, url: safeHttps(s[n.key] ?? '') })).filter((n) => n.url);
  });
  readonly mapUrl = computed<SafeResourceUrl | null>(() => {
    const q = this.state().mapQuery || this.fullAddress();
    if (!q) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`);
  });

  constructor() {
    this.load().subscribe();
  }

  load(force = false): Observable<SiteSettings> {
    if (!this.request$ || force) {
      this.request$ = this.api.get<SiteSettings>('/site/settings').pipe(
        map((s) => ({ ...DEFAULT_SITE_SETTINGS, ...s })),
        catchError(() => of(this.state())),
        shareReplay(1),
      );
      this.request$.subscribe((s) => this.state.set(s));
    }
    return this.request$;
  }

  /** Après une modification dans l'admin : met tout le site à jour sans recharger. */
  apply(settings: SiteSettings): void {
    this.state.set({ ...DEFAULT_SITE_SETTINGS, ...settings });
    this.request$ = of(this.state());
  }

  page<T>(slug: string, force = false): Observable<SitePage<T>> {
    if (force || !this.pageCache.has(slug)) {
      const req$ = this.api.get<SitePage<T>>(`/site/pages/${encodeURIComponent(slug)}`).pipe(shareReplay(1));
      this.pageCache.set(slug, req$ as Observable<SitePage<unknown>>);
      req$.pipe(catchError(() => of(null))).subscribe((res) => {
        if (!res) this.pageCache.delete(slug);
      });
    }
    return this.pageCache.get(slug) as Observable<SitePage<T>>;
  }

  invalidatePage(slug: string): void {
    this.pageCache.delete(slug);
  }

  whatsappUrl(text?: string): string {
    const digits = this.whatsappDigits();
    if (!digits) return '';
    return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  }

  /** Remplace les raccourcis {boutique}, {email}… par les informations actuelles de la boutique. */
  fill(text: string): string {
    const s = this.state();
    const tokens: Record<string, string> = {
      boutique: s.storeName,
      email: s.email,
      telephone: s.phone,
      whatsapp: s.whatsapp,
      adresse: this.fullAddress(),
      ville: s.city,
    };
    return (text ?? '').replace(/\{(boutique|email|telephone|whatsapp|adresse|ville)\}/g, (_, k: string) => tokens[k] || '');
  }
}
