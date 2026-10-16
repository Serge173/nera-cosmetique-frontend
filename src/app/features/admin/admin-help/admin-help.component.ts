import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Guide {
  icon: string;
  title: string;
  link: string;
  steps: string[];
}

@Component({
  selector: 'app-admin-help',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="adm-page-head">
      <div>
        <h1>Aide</h1>
        <p>Les gestes essentiels pour piloter la boutique au quotidien.</p>
      </div>
      <div class="adm-page-actions">
        <a routerLink="/admin/messages" class="adm-btn adm-btn-ghost"><i class="fa-solid fa-headset"></i> Messages clients</a>
      </div>
    </header>

    <div class="guides">
      @for (g of guides; track g.title; let i = $index) {
        <article class="adm-card guide" [class.open]="openIndex() === i">
          <button type="button" class="g-head" (click)="toggle(i)" [attr.aria-expanded]="openIndex() === i">
            <span class="g-icon"><i class="fa-solid {{ g.icon }}"></i></span>
            <strong>{{ g.title }}</strong>
            <i class="fa-solid fa-chevron-down g-caret"></i>
          </button>
          @if (openIndex() === i) {
            <div class="g-body">
              <ol>
                @for (s of g.steps; track $index) { <li>{{ s }}</li> }
              </ol>
              <a [routerLink]="g.link" class="adm-btn adm-btn-soft adm-btn-sm">Ouvrir <i class="fa-solid fa-arrow-right"></i></a>
            </div>
          }
        </article>
      }
    </div>

    <section class="adm-card statuses">
      <div class="adm-card-head"><h2>Cycle de vie d'une commande</h2></div>
      <div class="adm-card-body flow">
        <div><span class="adm-badge amber">En attente</span><p>Commande reçue, à confirmer avec la cliente (appel ou message).</p></div>
        <i class="fa-solid fa-arrow-right"></i>
        <div><span class="adm-badge violet">Payée</span><p>Paiement reçu (ou confirmé pour un paiement à la livraison).</p></div>
        <i class="fa-solid fa-arrow-right"></i>
        <div><span class="adm-badge orange">En traitement</span><p>Préparation et emballage du colis.</p></div>
        <i class="fa-solid fa-arrow-right"></i>
        <div><span class="adm-badge blue">Expédiée</span><p>Colis remis au livreur.</p></div>
        <i class="fa-solid fa-arrow-right"></i>
        <div><span class="adm-badge green">Livrée</span><p>Colis remis à la cliente : commande terminée.</p></div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .guides { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
    .g-head { display: flex; align-items: center; gap: 14px; width: 100%; padding: 16px 18px; background: none; text-align: left; }
    .g-head strong { flex: 1; font-size: .92rem; color: var(--adm-ink); }
    .g-icon { width: 42px; height: 42px; border-radius: 12px; background: var(--adm-orange-soft); color: var(--adm-orange); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .g-caret { font-size: .75rem; color: var(--adm-muted); transition: transform .2s; }
    .guide.open .g-caret { transform: rotate(180deg); color: var(--adm-orange); }
    .guide.open { border-color: #f8d9c5; }
    .g-body { padding: 0 18px 18px 74px; }
    .g-body ol { margin: 0 0 14px; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: .86rem; color: var(--adm-text); line-height: 1.5; }
    .statuses { margin-top: 20px; }
    .flow { display: flex; align-items: flex-start; gap: 12px; }
    .flow > div { flex: 1; min-width: 0; }
    .flow p { margin: 8px 0 0; font-size: .78rem; color: var(--adm-muted); line-height: 1.45; }
    .flow > i { color: #e9c5ad; margin-top: 6px; font-size: .8rem; }
    @media (max-width: 1000px) {
      .guides { grid-template-columns: 1fr; }
      .flow { flex-direction: column; }
      .flow > i { transform: rotate(90deg); margin: 0 0 0 30px; }
    }
    @media (max-width: 640px) { .g-body { padding-left: 18px; } }
  `],
})
export class AdminHelpComponent {
  readonly openIndex = signal<number | null>(0);

  readonly guides: Guide[] = [
    {
      icon: 'fa-clipboard-list', title: 'Traiter une nouvelle commande', link: '/admin/orders',
      steps: [
        'Ouvrez « Commandes » : les commandes en attente sont signalées par le badge du menu et la cloche.',
        'Cliquez sur « Voir » pour afficher le détail (articles, adresse, téléphone).',
        'Confirmez avec la cliente, puis faites avancer le statut étape par étape jusqu’à « Livrée ».',
      ],
    },
    {
      icon: 'fa-bag-shopping', title: 'Ajouter ou modifier un produit', link: '/admin/products',
      steps: [
        'Dans « Produits », renseignez le nom, le prix, la catégorie, la marque et le stock.',
        'Ajoutez une photo (JPG, PNG ou WebP) : elle est vérifiée puis hébergée automatiquement.',
        'Cochez « En vedette » pour le mettre en avant sur la boutique.',
      ],
    },
    {
      icon: 'fa-cube', title: 'Suivre les stocks', link: '/admin/stock',
      steps: [
        'La page « Gestion des stocks » signale les produits en rupture ou en stock faible (seuil réglable, 5 par défaut).',
        'Mettez les quantités à jour dans la fiche produit dès réception d’une livraison fournisseur.',
        'La cloche de notifications vous alerte lorsqu’un produit passe sous 5 unités.',
      ],
    },
    {
      icon: 'fa-tag', title: 'Créer un code promo', link: '/admin/promotions',
      steps: [
        'Dans « Promotions », cliquez sur « Nouveau code promo ».',
        'Choisissez un pourcentage ou un montant fixe, un minimum de commande et des dates si besoin.',
        'Partagez le code sur vos réseaux : la cliente le saisit au moment de commander.',
      ],
    },
    {
      icon: 'fa-star', title: 'Modérer les avis', link: '/admin/avis',
      steps: [
        'Les avis non approuvés sont signalés « En attente » dans « Avis & Notations ».',
        'Approuvez les avis authentiques ; masquez ou supprimez ceux qui sont abusifs.',
      ],
    },
    {
      icon: 'fa-chart-line', title: 'Lire les rapports', link: '/admin/rapports',
      steps: [
        'Choisissez une période (7 jours à 12 mois) pour comparer avec la période précédente.',
        'Exportez les chiffres au format CSV pour les ouvrir dans Excel ou Google Sheets.',
      ],
    },
  ];

  toggle(i: number): void {
    this.openIndex.update((v) => (v === i ? null : i));
  }
}
