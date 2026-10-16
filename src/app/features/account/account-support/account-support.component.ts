import { AfterViewInit, Component, DestroyRef, ElementRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { formatPrice } from '../../admin/shared/admin-format';

interface DeliveryOption { method: string; price: number; freeFrom: number | null }

interface Faq { q: string; a: string; link?: { label: string; path: string; fragment?: string } }

const WHATSAPP = 'https://wa.me/2250789684467';

@Component({
  selector: 'app-account-support',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="adm-page-head">
      <div>
        <h1>Service client</h1>
        <p>Une question, un souci avec une commande ? Notre équipe est là pour vous accompagner.</p>
      </div>
    </div>

    <div class="quick">
      <a [href]="whatsapp" target="_blank" rel="noopener noreferrer" class="adm-card q-card wa">
        <span class="q-icon"><i class="fa-brands fa-whatsapp"></i></span>
        <span class="q-text"><strong>WhatsApp</strong><small>+225 07 89 68 44 67</small></span>
        <i class="fa-solid fa-arrow-up-right-from-square q-go"></i>
      </a>
      <a href="mailto:skeayeni&#64;gmail.com" class="adm-card q-card">
        <span class="q-icon"><i class="fa-regular fa-envelope"></i></span>
        <span class="q-text"><strong>E-mail</strong><small>skeayeni&#64;gmail.com</small></span>
        <i class="fa-solid fa-chevron-right q-go"></i>
      </a>
      <a routerLink="/compte/commandes" class="adm-card q-card">
        <span class="q-icon"><i class="fa-solid fa-truck-fast"></i></span>
        <span class="q-text"><strong>Suivre une commande</strong><small>Statut en temps réel</small></span>
        <i class="fa-solid fa-chevron-right q-go"></i>
      </a>
    </div>

    <div class="grid">
      <section class="adm-card pad" id="faq" aria-labelledby="faq-title">
        <h2 id="faq-title" class="title"><i class="fa-regular fa-comments"></i> Questions fréquentes</h2>
        <div class="faq">
          @for (f of faqs(); track f.q; let i = $index) {
            <div class="faq-item" [class.open]="openIndex() === i">
              <button type="button" class="faq-q" (click)="toggle(i)" [attr.aria-expanded]="openIndex() === i" [attr.aria-controls]="'faq-a-' + i">
                <span>{{ f.q }}</span>
                <i class="fa-solid fa-chevron-down"></i>
              </button>
              @if (openIndex() === i) {
                <div class="faq-a" [id]="'faq-a-' + i">
                  <p>{{ f.a }}</p>
                  @if (f.link) { <a [routerLink]="f.link.path" [fragment]="f.link.fragment" class="head-link">{{ f.link.label }} <i class="fa-solid fa-arrow-right"></i></a> }
                </div>
              }
            </div>
          }
        </div>
      </section>

      <div class="side">
        <section class="adm-card pad" id="contact" aria-labelledby="contact-title">
          <h2 id="contact-title" class="title"><i class="fa-solid fa-headset"></i> Nous contacter</h2>
          <p class="muted">Le plus rapide : écrivez-nous sur WhatsApp en indiquant votre numéro de commande. Nous répondons sous 24 à 48 h ouvrées.</p>
          <a [href]="whatsapp" target="_blank" rel="noopener noreferrer" class="adm-btn block wa-btn"><i class="fa-brands fa-whatsapp"></i> Écrire sur WhatsApp</a>
          <a routerLink="/contact" class="adm-btn adm-btn-ghost block"><i class="fa-regular fa-paper-plane"></i> Formulaire de contact</a>
        </section>

        <section class="adm-card pad" id="retours" aria-labelledby="returns-title">
          <h2 id="returns-title" class="title"><i class="fa-solid fa-rotate-left"></i> Retour & remboursement</h2>
          <p class="muted">Un produit abîmé ou non conforme ? Contactez-nous avec votre numéro de commande et une photo du produit : nous trouverons une solution ensemble.</p>
          <a [href]="whatsapp" target="_blank" rel="noopener noreferrer" class="head-link">Signaler un problème <i class="fa-solid fa-arrow-right"></i></a>
        </section>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .quick { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
    .q-card { display: flex; align-items: center; gap: 14px; padding: 18px; text-decoration: none; color: inherit; transition: transform .2s, box-shadow .2s; }
    .q-card:hover { transform: translateY(-2px); box-shadow: var(--adm-shadow-lg); }
    .q-icon { width: 48px; height: 48px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: var(--adm-orange-soft); color: var(--adm-orange); font-size: 1.2rem; flex-shrink: 0; }
    .wa .q-icon { background: #e3f6ea; color: #1f9d55; }
    .q-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .q-text strong { color: var(--adm-ink); }
    .q-text small { color: var(--adm-muted); font-size: .8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .q-go { color: #c9bdb5; font-size: .8rem; }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start; }
    .side { display: flex; flex-direction: column; gap: 20px; }
    .pad { padding: 22px 24px; scroll-margin-top: calc(var(--adm-topbar-h) + 16px); }
    .title { display: flex; align-items: center; gap: 10px; margin: 0 0 14px; font-size: 1.02rem; font-weight: 700; color: var(--adm-ink); }
    .title i { color: var(--adm-orange); }
    .muted { margin: 0 0 16px; font-size: .86rem; color: var(--adm-text); line-height: 1.55; }
    .block { width: 100%; }
    .block + .block { margin-top: 10px; }
    .wa-btn { background: #1f9d55; }
    .wa-btn:hover:not(:disabled) { background: #188247; box-shadow: 0 6px 16px rgba(31, 157, 85, .25); }
    .head-link { display: inline-flex; align-items: center; gap: 6px; font-size: .84rem; font-weight: 600; color: var(--adm-orange-dark); text-decoration: none; }
    .head-link:hover { color: var(--adm-orange); }
    .faq { display: flex; flex-direction: column; }
    .faq-item { border-top: 1px solid var(--adm-line); }
    .faq-item:first-child { border-top: 0; }
    .faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 16px 2px; background: none; font: inherit; font-size: .92rem; font-weight: 600; color: var(--adm-ink); text-align: left; }
    .faq-q i { color: var(--adm-muted); font-size: .8rem; transition: transform .25s; flex-shrink: 0; }
    .faq-q:hover { color: var(--adm-orange-dark); }
    .open .faq-q { color: var(--adm-orange-dark); }
    .open .faq-q i { transform: rotate(180deg); color: var(--adm-orange); }
    .faq-a { padding: 0 2px 16px; animation: fade .2s ease; }
    .faq-a p { margin: 0 0 8px; font-size: .87rem; line-height: 1.6; color: var(--adm-text); }
    @keyframes fade { from { opacity: 0; transform: translateY(-4px); } }
    @media (max-width: 1100px) { .grid { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 760px) { .quick { grid-template-columns: minmax(0, 1fr); gap: 12px; } .pad { padding: 18px 16px; } }
  `],
})
export class AccountSupportComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private host = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  readonly whatsapp = WHATSAPP;
  readonly openIndex = signal<number | null>(0);
  readonly faqs = signal<Faq[]>(this.buildFaqs(null));

  ngOnInit(): void {
    this.api.get<DeliveryOption[]>('/orders/delivery-options').subscribe({
      next: (options) => this.faqs.set(this.buildFaqs(Array.isArray(options) ? options : null)),
      error: () => {},
    });
  }

  ngAfterViewInit(): void {
    this.route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fragment) => {
      if (!fragment || !/^[a-z-]+$/.test(fragment)) return;
      setTimeout(() => {
        const el = this.host.nativeElement.querySelector(`#${fragment}`) as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  toggle(i: number): void {
    this.openIndex.update((cur) => (cur === i ? null : i));
  }

  private buildFaqs(options: DeliveryOption[] | null): Faq[] {
    const abidjan = options?.find((o) => o.method === 'abidjan');
    const interior = options?.find((o) => o.method === 'interior');
    const free = options?.find((o) => o.freeFrom)?.freeFrom;
    const shipping = abidjan && interior
      ? `La livraison coûte ${formatPrice(abidjan.price)} à Abidjan et ${formatPrice(interior.price)} pour l'intérieur du pays.${free ? ` Elle est offerte dès ${formatPrice(free)} d'achats.` : ''} Le montant exact est affiché avant la validation de votre commande.`
      : `Les frais de livraison dépendent de votre zone (Abidjan ou intérieur du pays) et sont affichés avant la validation de votre commande.`;
    return [
      {
        q: 'Comment suivre ma commande ?',
        a: 'Rendez-vous dans « Mes commandes » : chaque commande affiche son statut (reçue, en préparation, expédiée, livrée). La cloche en haut de l’écran vous signale vos commandes en cours.',
        link: { label: 'Voir mes commandes', path: '/compte/commandes' },
      },
      { q: 'Quels sont les frais et délais de livraison ?', a: `${shipping} Le livreur vous appelle avant de passer.` },
      { q: 'Quels moyens de paiement acceptez-vous ?', a: 'Vous réglez votre commande directement à la livraison, à la réception de votre colis.' },
      {
        q: 'Comment utiliser un code promo ou un bon fidélité ?',
        a: 'Saisissez votre code dans le panier puis cliquez sur « Appliquer ». La réduction est recalculée automatiquement. Un bon fidélité ne peut être utilisé qu’une fois, avec votre compte.',
        link: { label: 'Mes points fidélité', path: '/compte/fidelite' },
      },
      {
        q: 'Comment fonctionnent les points fidélité ?',
        a: 'Vous gagnez 1 point pour chaque tranche de 1 000 F CFA d’articles livrés. Chaque point vaut 10 F CFA : dès 100 points, convertissez-les en bon de réduction valable 90 jours.',
        link: { label: 'Découvrir le programme', path: '/compte/fidelite' },
      },
      {
        q: 'Puis-je modifier ou annuler ma commande ?',
        a: 'Contactez-nous au plus vite sur WhatsApp en indiquant votre numéro de commande : nous verrons ensemble ce qui est possible selon l’avancement de sa préparation.',
        link: { label: 'Nous contacter', path: '/compte/support', fragment: 'contact' },
      },
      {
        q: 'Comment modifier mes informations ou mon mot de passe ?',
        a: 'Depuis « Mon profil », vous pouvez mettre à jour votre nom, votre téléphone et changer votre mot de passe. Vos adresses se gèrent dans « Mes adresses ».',
        link: { label: 'Mon profil', path: '/compte/profil' },
      },
    ];
  }
}
